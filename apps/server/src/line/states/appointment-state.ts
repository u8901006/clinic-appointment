import { lineClient } from '../client'
import { stateManager } from './state-manager'
import { doctorService } from '../../services/doctor.service'
import { patientService } from '../../services/patient.service'
import { appointmentService } from '../../services/appointment.service'
import { slotService } from '../../services/slot.service'

const STEPS = {
  SELECT_DOCTOR: 'select_doctor',
  SELECT_DATE: 'select_date',
  SELECT_SLOT: 'select_slot',
  INPUT_NAME: 'input_name',
  INPUT_PHONE: 'input_phone',
  CONFIRM: 'confirm'
}

export async function handleAppointmentFlow(userId: string, text: string, lineUserId: string) {
  const state = stateManager.get(userId)

  if (!state || text === '取消') {
    stateManager.clear(userId)
    return startAppointment(userId)
  }

  switch (state.step) {
    case STEPS.SELECT_DOCTOR:
      return handleSelectDoctor(userId, text)
    case STEPS.SELECT_DATE:
      return handleSelectDate(userId, text)
    case STEPS.SELECT_SLOT:
      return handleSelectSlot(userId, text)
    case STEPS.INPUT_NAME:
      return handleInputName(userId, text, lineUserId)
    case STEPS.INPUT_PHONE:
      return handleInputPhone(userId, text)
    case STEPS.CONFIRM:
      return handleConfirm(userId, text)
    default:
      return startAppointment(userId)
  }
}

async function startAppointment(userId: string) {
  const doctors = await doctorService.findAll()
  const doctorList = doctors.map((d, i) => `${i + 1}. ${d.name} (${d.specialty})`).join('\n')

  stateManager.set(userId, STEPS.SELECT_DOCTOR, { doctors })

  return lineClient.pushMessage({
    to: userId,
    messages: [{
      type: 'text',
      text: `請選擇醫師（輸入編號）：\n${doctorList}\n\n輸入「取消」可返回`
    }]
  })
}

async function handleSelectDoctor(userId: string, text: string) {
  const state = stateManager.get(userId)
  if (!state) return

  const index = parseInt(text) - 1
  const doctor = state.data.doctors?.[index]

  if (!doctor) {
    return lineClient.pushMessage({
      to: userId,
      messages: [{ type: 'text', text: '請輸入有效的醫師編號' }]
    })
  }

  stateManager.update(userId, { step: STEPS.SELECT_DATE, data: { ...state.data, doctorId: doctor.id, doctorName: doctor.name } })

  return lineClient.pushMessage({
    to: userId,
    messages: [{ type: 'text', text: `您選擇了 ${doctor.name}\n\n請輸入預約日期（格式：YYYY-MM-DD）` }]
  })
}

async function handleSelectDate(userId: string, text: string) {
  const state = stateManager.get(userId)
  if (!state) return

  const date = new Date(text)
  if (isNaN(date.getTime())) {
    return lineClient.pushMessage({
      to: userId,
      messages: [{ type: 'text', text: '日期格式錯誤，請輸入 YYYY-MM-DD' }]
    })
  }

  const slots = await slotService.findByDoctorAndDate(state.data.doctorId, date)
  const availableSlots = slots.filter(s => s.currentCount < s.maxPatients)

  if (availableSlots.length === 0) {
    return lineClient.pushMessage({
      to: userId,
      messages: [{ type: 'text', text: '該日期沒有可預約的時段，請選擇其他日期' }]
    })
  }

  const slotList = availableSlots.map((s, i) => `${i + 1}. ${s.startTime} - ${s.endTime} (${s.currentCount}/${s.maxPatients})`).join('\n')
  stateManager.update(userId, { step: STEPS.SELECT_SLOT, data: { ...state.data, date: text, slots: availableSlots } })

  return lineClient.pushMessage({
    to: userId,
    messages: [{ type: 'text', text: `可預約時段：\n${slotList}\n\n請輸入時段編號` }]
  })
}

async function handleSelectSlot(userId: string, text: string) {
  const state = stateManager.get(userId)
  if (!state) return

  const index = parseInt(text) - 1
  const slot = state.data.slots?.[index]

  if (!slot) {
    return lineClient.pushMessage({
      to: userId,
      messages: [{ type: 'text', text: '請輸入有效的時段編號' }]
    })
  }

  stateManager.update(userId, { step: STEPS.INPUT_NAME, data: { ...state.data, slotId: slot.id } })

  return lineClient.pushMessage({
    to: userId,
    messages: [{ type: 'text', text: '請輸入您的姓名' }]
  })
}

async function handleInputName(userId: string, text: string, lineUserId: string) {
  const state = stateManager.get(userId)
  if (!state) return

  let patient = await patientService.findByLineUserId(lineUserId)
  if (!patient) {
    patient = await patientService.create({ lineUserId, name: text, phone: '' })
  } else {
    await patientService.update(patient.id, { name: text })
  }

  stateManager.update(userId, { step: STEPS.INPUT_PHONE, data: { ...state.data, patientId: patient.id, name: text } })

  return lineClient.pushMessage({
    to: userId,
    messages: [{ type: 'text', text: '請輸入您的聯絡電話' }]
  })
}

async function handleInputPhone(userId: string, text: string) {
  const state = stateManager.get(userId)
  if (!state) return

  await patientService.update(state.data.patientId, { phone: text })
  stateManager.update(userId, { step: STEPS.CONFIRM, data: { ...state.data, phone: text } })

  return lineClient.pushMessage({
    to: userId,
    messages: [{
      type: 'text',
      text: `請確認預約資訊：\n\n醫師：${state.data.doctorName}\n日期：${state.data.date}\n姓名：${state.data.name}\n電話：${text}\n\n輸入「確認」完成預約，輸入「取消」返回`
    }]
  })
}

async function handleConfirm(userId: string, text: string) {
  const state = stateManager.get(userId)
  if (!state) return

  if (text !== '確認') {
    return lineClient.pushMessage({
      to: userId,
      messages: [{ type: 'text', text: '請輸入「確認」完成預約，或「取消」返回' }]
    })
  }

  try {
    const appointment = await appointmentService.create({
      patientId: state.data.patientId,
      timeSlotId: state.data.slotId
    })

    stateManager.clear(userId)

    return lineClient.pushMessage({
      to: userId,
      messages: [{
        type: 'text',
        text: `預約成功！\n\n您的預約號碼：${appointment.queueNumber}\n請準時到診，謝謝！`
      }]
    })
  } catch (error: any) {
    return lineClient.pushMessage({
      to: userId,
      messages: [{ type: 'text', text: `預約失敗：${error.message}` }]
    })
  }
}
