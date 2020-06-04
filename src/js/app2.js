import * as THREE from 'three'

class App {
  constructor () {
    this.canvas = document.createElement('canvas')
  }

  init () {
    document.body.classList.add('loading')

    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0xE2E8F0)

    this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 0.1, 10000)
    this.camera.position.set(0, 0, Math.min(window.innerWidth, window.innerHeight))
    this.camera.lookAt(0, 0, 0)

    this.scene.add(this.camera)

    this.renderer = new THREE.WebGLRenderer()
    document.body.prepend(this.renderer.domElement)

    this.clock = new THREE.Clock()

    this.resize()

    if (navigator.mediaDevices) {
      this.initAudio()
      this.initVideo()
    } else {
      document.getElementById('message').classList.remove('hide')
    }

    this.draw()

    window.addEventListener('resize', this.resize.bind(this))
  }

  initAudio () {
    const audioListener = new THREE.AudioListener()
    const audio = new THREE.Audio(audioListener)

    const audioLoader = new THREE.AudioLoader()
    audioLoader.load('Cubic_Z.mp3', buffer => {
      document.body.classList.remove('loading')
      audio.setBuffer(buffer)
      audio.setLoop(true)
      audio.setVolume(0.5)
    })

    this.analyzer = new THREE.AudioAnalyser(audio, 2048)

    document.body.addEventListener('click', () => {
      if (audio && audio.isPlaying) {
        audio.pause()
      } else {
        audio.play()
      }
    })
  }

  async initVideo () {
    this.video = document.getElementById('video')
    this.video.autoplay = true

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      this.video.srcObject = stream
      this.video.addEventListener('loadeddata', () => {
        this.createParticles()
      })
    } catch (error) {
      document.getElementById('message').classList.remove('hide')
    }
  }

  createParticles () {
    const imageData = this.getImageData(this.video)

    const geometry = new THREE.Geometry()
    geometry.morphAttributes = {}

    const material = new THREE.PointsMaterial({
      size: 1,
      color: 0x805AD5,
      sizeAttenuation: false
    })

    this.width = imageData.width
    this.height = imageData.height

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const vertex = new THREE.Vector3(x - imageData.width / 2, -y + imageData.height / 2, 0)
        geometry.vertices.push(vertex)
      }
    }

    this.particles = new THREE.Points(geometry, material)
    this.scene.add(this.particles)
  }

  getImageData (video, useCache) {
    if (useCache && this.imageCache) {
      return this.imageCache
    }

    this.canvas.width = video.videoWidth
    this.canvas.height = video.videoHeight

    const ctx = this.canvas.getContext('2d')
    ctx.translate(video.videoWidth, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(video, 0, 0)

    this.imageCache = ctx.getImageData(0, 0, video.videoWidth, video.videoHeight)

    return this.imageCache
  }

  draw () {
    let bass, mid, treble

    if (this.analyzer) {
      const data = this.analyzer.getFrequencyData()

      bass = this.getFrequencyRangeValue(data, [20, 140])
      mid = this.getFrequencyRangeValue(data, [400, 2600])
      treble = this.getFrequencyRangeValue(data, [5200, 14000])
    }

    if (this.particles) {
      this.particles.material.color.r = 1 - bass
      this.particles.material.color.g = 1 - mid
      this.particles.material.color.b = 1 - treble

      const useCache = this.clock.getDelta % 2 === 0 
      const imageData = this.getImageData(video, useCache)

      for (let i = 0; i < this.particles.geometry.vertices.length; i++) {
        const particle = this.particles.geometry.vertices[i]

        if (i % 2 === 0) {
          particle.z = 10000
          continue
        }

        const index = i * 4
        const grey = (imageData.data[index] + imageData.data[index + 1] + imageData.data[index + 2]) / 3

        if (grey < 100) {
          particle.z = grey * bass * 5
        }

        if (grey < 150) {
          particle.z = grey * mid * 5
        }

        if (grey < 300) {
          particle.z = grey * treble * 5
        }

        if (grey >= 300) {
          particle.z = 10000
        }
      }

      this.particles.geometry.verticesNeedUpdate = true
    }

    this.renderer.render(this.scene, this.camera)

    requestAnimationFrame(this.draw.bind(this))
  }

  getFrequencyRangeValue (data, frequencyRange) {
    const lowIndex = Math.round(frequencyRange[0] / 24000 * data.length)
    const highIndex = Math.round(frequencyRange[1] / 24000 * data.length)

    let total = 0
    let frequencyCount = 0

    for (let i = lowIndex; i <= highIndex; i++) {
      total += data[i]
      frequencyCount++
    }

    return total / frequencyCount / 255
  }

  resize() {
    this.width = window.innerWidth
    this.height = window.innerHeight

    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.setSize(this.width, this.height)

    this.camera.aspect = this.width / this.height
    this.camera.updateProjectionMatrix()
  }
}

window.addEventListener('DOMContentLoaded', e => {
  const app = new App()
  app.init()
})