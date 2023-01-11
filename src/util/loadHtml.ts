export const loadHtml = (url: string): Promise<string> =>
  new Promise((resolve, reject) => {
    const request = new XMLHttpRequest()
    request.open('GET', url)
    request.onload = () => {
      if (request.status >= 200 && request.status < 300) {
        resolve(request.responseText)
      } else {
        reject({
          status: request.status,
          statusText: request.statusText,
        })
      }
    }
    request.onerror = function () {
      reject({
        status: request.status,
        statusText: request.statusText,
      })
    }
    request.send()
  })
