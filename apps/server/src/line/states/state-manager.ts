interface State {
  step: string
  data: Record<string, any>
}

const states = new Map<string, State>()

export const stateManager = {
  set(userId: string, step: string, data: Record<string, any> = {}) {
    states.set(userId, { step, data })
  },

  get(userId: string): State | undefined {
    return states.get(userId)
  },

  clear(userId: string) {
    states.delete(userId)
  },

  update(userId: string, updates: Partial<State>) {
    const current = states.get(userId)
    if (current) {
      states.set(userId, { ...current, ...updates })
    }
  }
}
