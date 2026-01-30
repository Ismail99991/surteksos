import QRCode from 'qrcode'

export interface QRData {
  kartelaNo: string
  renkKodu: string
  renkAdi: string
  durum: string
  gozSayisi: number
  maksimumGoz: number
  musteriAdi?: string
  projeKodu?: string
  pantoneKodu?: string
  tarih: string
}

export function generateQRText(data: QRData): string {
  let text = `KARTELA:${data.kartelaNo}\n`
  text += `RENK:${data.renkKodu}\n`
  text += `ADI:${data.renkAdi}\n`
  text += `DURUM:${data.durum}\n`
  text += `GOZ:${data.gozSayisi}/${data.maksimumGoz}\n`
  
  if (data.musteriAdi) {
    text += `MUSTERI:${data.musteriAdi.toUpperCase()}\n`
  }
  
  text += `TARIH:${data.tarih}\n`
  
  if (data.pantoneKodu) {
    text += `PANTONE:${data.pantoneKodu}`
  }
  
  return text
}

export async function generateQRCodeImage(data: QRData): Promise<string> {
  const qrText = generateQRText(data)
  try {
    const qrDataUrl = await QRCode.toDataURL(qrText, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })
    return qrDataUrl
  } catch (error) {
    console.error('QR kod oluşturma hatası:', error)
    throw error
  }
}

export function downloadQRCode(dataUrl: string, fileName: string = 'kartela-qr.png') {
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
