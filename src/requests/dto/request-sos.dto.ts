export class RequestSosDTO {
  id: string
  name: string
  phone: string
  position?: {
    lat: number
    lng: number
  }
  address?: string
  comment: string
  vehicle: string
}
