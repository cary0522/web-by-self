interface LoginAttemptState {
    count: number
    resetAt: number
}

export interface LoginRateLimit {
    retryAfterSeconds: number
}

const LOGIN_ATTEMPT_WINDOW_MS = 15 * 60 * 1000
const MAX_ACCOUNT_ATTEMPTS = 5
const MAX_IP_ATTEMPTS = 50
const SWEEP_INTERVAL = 100

const attempts = new Map<string, LoginAttemptState>()
let attemptsSinceSweep = 0

function accountKey(account: string): string {
    return `account:${account}`
}

function ipKey(ip: string): string {
    return `ip:${ip}`
}

function getActiveState(key: string, now: number): LoginAttemptState | undefined {
    const state = attempts.get(key)

    if (state && state.resetAt <= now) {
        attempts.delete(key)
        return undefined
    }

    return state
}

function sweepExpiredAttempts(now: number): void {
    attemptsSinceSweep++
    if (attemptsSinceSweep < SWEEP_INTERVAL) {
        return
    }

    attemptsSinceSweep = 0
    for (const [key, state] of attempts) {
        if (state.resetAt <= now) {
            attempts.delete(key)
        }
    }
}

function retryAfter(state: LoginAttemptState, now: number): LoginRateLimit {
    return {
        retryAfterSeconds: Math.max(1, Math.ceil((state.resetAt - now) / 1000)),
    }
}

function increment(key: string, now: number): void {
    const state = getActiveState(key, now)

    if (state) {
        state.count++
        return
    }

    attempts.set(key, {
        count: 1,
        resetAt: now + LOGIN_ATTEMPT_WINDOW_MS,
    })
}

function getLimit(account: string, ip: string, now: number): LoginRateLimit | null {
    const accountState = getActiveState(accountKey(account), now)
    const ipState = getActiveState(ipKey(ip), now)
    const blockedStates = [
        accountState && accountState.count >= MAX_ACCOUNT_ATTEMPTS ? accountState : undefined,
        ipState && ipState.count >= MAX_IP_ATTEMPTS ? ipState : undefined,
    ].filter((state): state is LoginAttemptState => Boolean(state))

    if (blockedStates.length === 0) {
        return null
    }

    // 若同時觸發兩種限制，等兩個視窗都到期後才允許重試。
    const resetAt = Math.max(...blockedStates.map(state => state.resetAt))
    return retryAfter({ count: 0, resetAt }, now)
}

/**
 * 在進行資料庫查詢或 bcrypt 比對前保留一次嘗試額度。
 * 回傳限制資訊代表本次請求不應繼續處理。
 */
export function consumeLoginAttempt(account: string, ip: string): LoginRateLimit | null {
    const now = Date.now()
    sweepExpiredAttempts(now)

    const limit = getLimit(account, ip, now)
    if (limit) {
        return limit
    }

    increment(accountKey(account), now)
    increment(ipKey(ip), now)
    return null
}

/** 第 N 次失敗後立即回覆 429，不必再等下一次請求。 */
export function getLoginRateLimit(account: string, ip: string): LoginRateLimit | null {
    return getLimit(account, ip, Date.now())
}

/** 成功登入只清除帳號限制；來源 IP 的整體速率限制仍保留。 */
export function clearLoginAccountAttempts(account: string): void {
    attempts.delete(accountKey(account))
}
