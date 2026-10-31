import { migrateLegacyPublicUploads } from '../utils/file'

export default defineNitroPlugin(async () => {
    await migrateLegacyPublicUploads()
})
