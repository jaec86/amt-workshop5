import p5 from 'p5'
import Tone from 'tone'

const s = (sketch) => {

  let synth

  let playing = false

  let sequence

  let currentColumn = 0

  const notes = ['A3', 'C4', 'D4', 'E3', 'G4']

  const numRows = notes.length

  const numCols = 16

  const noteInterval = `${numCols}n`

  Tone.Transport.bpm.value = 120

  const data = []

  for (let y = 0; y < numRows; y++) {
    const row = []
    for (let x = 0; x < numCols; x++) {
      row.push(0)
    }
    data.push(row)
  }

  sketch.setup = async () => {
    const dim = sketch.min(sketch.windowWidth, sketch.windowHeight)
    sketch.createCanvas(dim, dim)
    sketch.pixelDensity(window.devicePixelRatio)
    sketch.background(226, 232, 240)

    const reverb = new Tone.Reverb({ decay: 4, wet: 0.2, preDelay: 0.25 })
    await reverb.generate()

    const effect = new Tone.FeedbackDelay(`${Math.floor(numCols / 2)}n`, 1 / 3)
    effect.wet.value = 0.2

    synth = new Tone.PolySynth(numRows, Tone.DuoSynth)
    synth.set({
      voice0: {
        oscillator: {
          type: "triangle4"
        },
        volume: -30,
        envelope: {
          attack: 0.005,
          release: 0.05,
          sustain: 1
        }
      },
      voice1: {
        volume: -10,
        envelope: {
          attack: 0.005,
          release: 0.05,
          sustain: 1
        }
      }
    })

    synth.volume.value = -10
    synth.connect(effect)
    synth.connect(Tone.Master)
    effect.connect(reverb)
    reverb.connect(Tone.Master)

    Tone.Transport.scheduleRepeat(() => {
      sketch.randomizeSequencer()
    }, '2m')
  }

  sketch.draw = () => {
    if (!synth) return

    const dim = sketch.min(sketch.width, sketch.height)

    sketch.background(226, 232, 240)

    if (playing) {
      const margin = dim * 0.2
      const innerSize = dim - margin * 2
      const cellSize = innerSize / numCols

      for (let y = 0; y < data.length; y++) {
        const row = data[y]
        for (let x = 0; x < row.length; x++) {
          const u = x / (numCols - 1)
          const v = y / (numRows - 1)
          let px = sketch.lerp(margin, dim - margin, u)
          let py = sketch.lerp(margin, dim - margin, v)

          sketch.noStroke()
          sketch.noFill()

          if (row[x] === 1) {
            sketch.fill(45, 55, 72)
          } else {
            sketch.stroke(45, 55, 72)
          }

          sketch.circle(px, py, cellSize / 2)

          if (x === currentColumn) {
            sketch.rectMode(sketch.CENTER)
            sketch.rect(px, py, cellSize, cellSize)
          }
        }
      }
    } else {
      sketch.noStroke()
      sketch.fill(45, 55, 72)
      sketch.polygon(sketch.width / 2, sketch.height / 2, dim * 0.05, 3)
    }
  }

  sketch.randomizeSequencer = () => {
    const chance = sketch.random(0.5, 1.5)
    for (let y = 0; y < data.length; y++) {
      const row = data[y]
      for (let x = 0; x < row.length; x++) {
        row[x] = sketch.randomGaussian() > chance ? 1 : 0
      }
      for (let x = 0; x < row.length - 1; x++) {
        if (row[x] === 1 && row[x + 1] === 1) {
          row[x + 1] = 0
          x++
        }
      }
    }
  }

  sketch.windowResized = () => {
    const dim = sketch.min(sketch.windowWidth, sketch.windowHeight)
    sketch.resizeCanvas(dim, dim)
  }

  sketch.mousePressed = () => {
    if (!synth) return

    if (playing) {
      playing = false
      sequence.stop()
      Tone.Transport.stop()
    } else {
      const noteIndices = sketch.newArray(numCols)
      sequence = new Tone.Sequence(sketch.onSequenceStep, noteIndices, noteInterval)

      playing = true
      sequence.start()
      Tone.Transport.start()
    }
  }

  sketch.onSequenceStep = (time, column) => {
    let notesToPlay = []

    data.forEach((row, rowIndex) => {
      const isOn = row[column] == 1
      if (isOn) {
        const note = notes[rowIndex]
        notesToPlay.push(note)
      }
    })
    const velocity = sketch.random(0.5, 1)
    synth.triggerAttackRelease(notesToPlay, noteInterval, time, velocity)
    Tone.Draw.schedule(function() {
      currentColumn = column
    }, time)
  }

  sketch.polygon = (x, y, radius, sides = 3, angle = 0) => {
    sketch.beginShape()

    for (let i = 0; i < sides; i++) {
      const a = angle + sketch.TWO_PI * (i / sides)
      let sx = x + sketch.cos(a) * radius
      let sy = y + sketch.sin(a) * radius
      sketch.vertex(sx, sy)
    }

    sketch.endShape(sketch.CLOSE)
  }

  sketch.newArray = (n) => {
    const array = []

    for (let i = 0; i < n; i++) {
      array.push(i)
    }

    return array
  }
}

let myp5 = new p5(s, 'canvas')