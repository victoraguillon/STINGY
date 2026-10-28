import { mkdir } from 'node:fs/promises'
import sharp from 'sharp'

const source = 'public/brand/icon.svg'
await mkdir('public/icons', { recursive: true })

const targets = [
  { file: 'public/icons/icon-192.png', size: 192 },
  { file: 'public/icons/icon-512.png', size: 512 },
  { file: 'public/icons/icon-maskable-512.png', size: 512 },
  { file: 'public/icons/apple-touch-icon.png', size: 180 },
  { file: 'public/icons/favicon-32.png', size: 32 },
]

for (const target of targets) {
  await sharp(source).resize(target.size, target.size).png().toFile(target.file)
  console.log(`wrote ${target.file}`)
}
