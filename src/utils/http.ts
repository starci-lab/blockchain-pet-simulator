import { envConfig } from '@/configs/env'
import { ROUTES } from '@/constants/routes'
import { setAccessTokenToLS, setRefreshTokenToLS } from '@/utils/auth'
import type { AxiosError, AxiosInstance } from 'axios'
import axios from 'axios'

export class Http {
  instance: AxiosInstance
  accessToken: string
  refreshToken: string
  constructor() {
    this.accessToken = ''
    this.refreshToken = ''
    this.instance = axios.create({
      baseURL: envConfig.baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    })

    this.instance.interceptors.request.use(
      (config) => {
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Add a response interceptor
    this.instance.interceptors.response.use(
      (response) => {
        const { url } = response.config
        if (url === ROUTES.verify) {
          const data = response.data
          this.accessToken = data.accessToken
          this.refreshToken = data.refreshToken
          setAccessTokenToLS(this.accessToken)
          setRefreshTokenToLS(this.refreshToken)
        }
        return response
      },
      (error: AxiosError) => {
        return Promise.reject(error)
      }
    )
  }
}

const http = new Http().instance
export default http
