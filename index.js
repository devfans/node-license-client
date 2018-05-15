const fetch = require('node-fetch')
const md = require('machine-digest')
const fs = require('fs')
const crypto = require('crypto')

let logger

const crypt = (key, buf, encrypt=true) => {
  const max = encrypt ? 86 : 128
  const length = buf.byteLength
  let cursor = 0
  const bufs = []
  while (length - cursor > 0) {
    let size = length - cursor
    if (encrypt) bufs.push(crypto.privateEncrypt(key, buf.slice(cursor, size > max? cursor + max: length)))
    else bufs.push(crypto.publicDecrypt(key, buf.slice(cursor, size > max? cursor + max: length)))
    cursor = cursor + max
  }
  return Buffer.concat(bufs)
}

class LicenseClient {
  constructor (...args) {
    try {
      this._constructor(...args)
    } catch (e) {
      logger.error(e.toString())
      throw Error('Failed to init license client!')
    }
  }

  _constructor (options={}) {
    logger = options.logger || console
    if (options.certHex) this.PublicKey = Buffer.from(options.certHex, 'hex').toString()
    if (options.pemPath) this.PublicKey = fs.readFileSync(options.pemPath).toString()
    this.keyFilePath = options.keyFilePath || 'key.txt'
    this.licenseFilePath = options.licenseFilePath || 'license.txt'
    this.identity = options.identity
    this.licenseServer = options.licenseServer

    if (this.identity == null) throw Error('Please sepecify software identity!')
    if (this.PublicKey == null) throw Error('Please specify certHex(hex of public.pem) or pemPath(path of public.pem)!')
    if (this.licenseServer == null) throw Error('Please specify license server address!')

    // secret for machine digest
    md.secret = options.secret || this.identity
  }

  exit() {
    logger.error("Press Enter to exit...")
    const promise = new Promise((resolve, reject) => {
      process.openStdin().addListener("data", (data) => resolve(process.exit(2))) 
    })
    return promise
  }

  async checkLicense() {
    logger.info('verifying license')
    let result = {status: false}
    let failures = 0
    while (!result.status) {
      try {
        result = await this._checkLicense()
      } catch (e) {
        logger.error(e.toString()) 
        logger.error("Failed to verfiy software license, please check your license key and license file")
        failures++
        if (failures > 2) break;
      }
    } 

    if (!result.status) await this.exit()
   
    logger.info('License is valid...')
    if (result.meta.persist) return
    logger.info(`License expiration date is ${new Date(result.meta.endDate)}`)
    const _postCheck = ()=> {
      if (Date.now() > result.meta.endDate) {
        logger.error('Please request new license from software holder, thanks!')
        process.exit(2)
      }
      logger.info('licensing post check tick with success')
    }
    setInterval(_postCheck, 24*60*60*1000) // daily post check
  }

  async _checkLicense() {
    // load licenseKey from somewhere
    const licenseKey = fs.readFileSync(this.keyFilePath).toString().replace('\n', '')

    // get machine id
    const machineId = md.get().digest

    // load license from somewhere
    let _license
    try {
      _license = fs.readFileSync(this.licenseFilePath).toString().replace('\n', '')
    } catch (e) {
      logger.warn('Failed to load license file, fetching from license server')
      const params = { method: 'POST', body: JSON.stringify({id: machineId, key: licenseKey}),
                       headers: { 'Content-Type': 'application/json' } }
      const res = await fetch(this.licenseServer, params)
      const resData = await res.json()
      logger.debug(resData)
      if (resData.status !== 0) {
        throw Error('Failed to get license from server!, error code: ' + resData.status)
      }
      _license = resData.license
      fs.writeFileSync(this.licenseFilePath, resData.license, 'utf8')
    }
    const buf = Buffer.from(_license, 'hex')
    const license = JSON.parse(crypt(this.PublicKey, buf, false).toString())
    logger.debug(license)
    if (license.key === licenseKey && license.machine === machineId && license.identity === this.identity) {
      if (license.meta.persist || (license.meta.startDate < Date.now() && license.meta.endDate > Date.now())) {
        return { meta: license.meta, status: true }
      } else throw Error('invalid effect date of license')
    } else throw Error('invalid license')
  }

  verify() {
    return this.checkLicense()
  }

}

module.exports = LicenseClient
