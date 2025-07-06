export const setAccessTokenToLS = (access_token: string) => {
  localStorage.setItem('access_token', access_token)
}

export const setRefreshTokenToLS = (refresh_token: string) => {
  localStorage.setItem('refresh_token', refresh_token)
}

export const getAddressWalletFromLS = () => {
  return localStorage.getItem('address_wallet') || ''
}

export const setAddressWalletToLS = (address_wallet: string) => {
  localStorage.setItem('address_wallet', address_wallet)
}

export const clearLS = () => {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('address_wallet')
}

export const getAccessTokenFromLS = () => {
  return localStorage.getItem('access_token') || ''
}

export const getRefreshTokenFromLS = () =>
  localStorage.getItem('refresh_token') || ''
