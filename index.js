//////////
// Settings
//////////

var BPM = 90;

// set global tempo
Tone.Transport.bpm.value = BPM;

//////////
// Synths
//////////

function createKickSynth(options) {
  options = _.assign({
    pitchDecay: 0.05,
    octaves: 10,
    oscillator: {
      type: 'sine'
    },
    envelope: {
      attack: 0.001,
      decay: 0.4,
      sustain: 0.01,
      release: 1.4,
      attackCurve: 'exponential'
    }
  }, options);

  var synth = new Tone.MembraneSynth(options);

  return synth;
}

function createSnareSynth(options) {
  options = _.assign({
    'noise': {
        'type': 'white',
        'playbackRate': 5
    },
    'envelope': {
        'attack': 0.001,
        'decay': 0.3,
        'sustain': 0,
        'release': 0.3
    }
  }, options);

  var synth = new Tone.NoiseSynth(options);

  return synth;
}

function createSynth(options) {
  options = _.assign({
    "harmonicity":8,
    "modulationIndex": 2,
    "oscillator" : {
        "type": "sine"
    },
    "envelope": {
        "attack": 0.001,
        "decay": 2,
        "sustain": 0.1,
        "release": 2
    },
    "modulation" : {
        "type" : "square"
    },
    "modulationEnvelope" : {
        "attack": 0.002,
        "decay": 0.2,
        "sustain": 0,
        "release": 0.2
    }
}, options);

  var synth = new Tone.FMSynth(options);

  synth.volume.value = -12;

  return synth;
}

//////////
// Effects
//////////

function createReverb(options) {
  options = _.assign({
    roomSize: 0.7,
    dampening: 3000
  }, options);

  var reverb = new Tone.Freeverb(options.roomSize, options.dampening);

  return reverb;
}

function createDelay(options) {
  options = _.assign({
    delayTime: 0.25,
    feedback: 0.1
  }, options);

  var delay = new Tone.PingPongDelay(options.delayTime, options.feedback);

  return delay;
}

//////////
// Loops
//////////

function createDrumSequence(synth, note) {
  var notes = [];

  for(var i = 0; i < 4; i++) {

    // we need at least one subdivision
    var subdivisions = Math.round(Math.random() * 1) + 1;

    var subdivisionNotes = [];

    for (var j = 0; j < subdivisions; j++) {
      subdivisionNotes.push(note || 'C0');
    }

    notes.push(subdivisionNotes);
  }

  var sequence = new Tone.Sequence(function(time, note) {

    if (synth instanceof Tone.NoiseSynth) {
      synth.triggerAttackRelease('16n', time);
    } else {
      synth.triggerAttackRelease(note, '16n', time);
    }

  }, notes, '2n');

  return sequence;
}

function createSynthSequence(synth) {
  var scale = Tonal.scale('C oriental');

  // pick random scale
  var index = Math.floor(Math.random() * Tonal.scale.names().length);
  scale = Tonal.scale('C ' + Tonal.scale.names()[index]);

  console.warn(index, scale);

  scale = scale.map(function(note) {
    var transposed = Tonal.transpose(note + '1', '16M'); // transpose 2 octaves up

    return transposed;
  })

  // example: ['C4', ['E4', 'D4', 'E4'], 'G4', ['A4', 'G4']]
  var notes = [];

  for(var i = 0; i < 4; i++) {

    // we need at least one subdivision
    var subdivisions = Math.round(Math.random() * 3) + 1;

    var subdivisionNotes = [];

    for (var j = 0; j < subdivisions; j++) {
      subdivisionNotes.push(scale[Math.floor(Math.random() * scale.length)]);
    }

    notes.push(subdivisionNotes);
  }

  var sequence = new Tone.Sequence(function(time, note) {

    if (synth instanceof Tone.NoiseSynth) {
      synth.triggerAttackRelease('16n', time);
    } else {
      synth.triggerAttackRelease(note, '16n', time);
    }

  }, notes, '2n');

  return sequence;
}

//////////
// Setup synths & loops
//////////

var kickSequence, snareSequence, synthSequence;

function generateMusic() {
  if (kickSequence) {
    kickSequence.dispose();
  }

  if (snareSequence) {
    snareSequence.dispose();
  }

  if (synthSequence) {
    synthSequence.dispose();
  }

  var kickSynth = createKickSynth({
    pitchDecay: 0.1
  }).toMaster();

  var reverb = createReverb({
    roomSize: 0.9,
    dampening: 3000
  }).toMaster();

  var snareSynth = createSnareSynth();

  var delay = createDelay({
    delayTime: '16n'
  }).toMaster();

  snareSynth.connect(delay);

  kickSequence = createDrumSequence(kickSynth);

  kickSequence.start(0);

  snareSequence = createDrumSequence(snareSynth);

  snareSequence.start(0);

  var simpleSynth = createSynth({
    'oscillator': {
      'type': 'fatcustom',
    	'partials' : [0.2, 1, 0, 0.5, 0.1],
    	'spread' : 40,
    	'count' : 3
    },
    'envelope': {
      'attack': 0.001,
      'decay': 1.6,
      'sustain': 0,
      'release': 1.6
    }
  });
  simpleSynth.connect(reverb);

  synthSequence = createSynthSequence(simpleSynth);

  synthSequence.start(0);
}

generateMusic();

//////////
// UI
//////////

var isPlaying = false;

var buttonPlay = document.getElementById('button--play');
var icon = document.getElementById('icon');

buttonPlay.addEventListener('click', function() {
  toggleTransport();
});

var buttonGenerate = document.getElementById('button--generate');

buttonGenerate.addEventListener('click', generateMusic);

function toggleTransport() {
  if (isPlaying) {
    Tone.Transport.stop();
    isPlaying = false;
    document.body.classList.remove('playing');
    icon.classList.remove('fa-pause');
    icon.classList.add('fa-play');
  } else {
    Tone.Transport.start();
    isPlaying = true;
    document.body.classList.add('playing');
    icon.classList.remove('fa-play');
    icon.classList.add('fa-pause');
  }
}

var transportTime = document.querySelector('#transport-time');
var audioContextTime = document.querySelector('#audio-context-time');

function updateTime() {
	transportTime.textContent = Tone.Transport.seconds.toFixed(2);
	audioContextTime.textContent = Tone.now().toFixed(2);
}

var meter = new Tone.Meter();
var hearts = [].slice.call(document.getElementById('hearts').children);
Tone.Master.connect(meter);

function updateMeter() {
  var level = meter.value,
      count = Math.min(Math.round(level * 5), 5);

  hearts.forEach(function(heart) {
    heart.classList.add('disabled');
  });

  for (var i = 0; i < count; i++) {
    hearts[i].classList.remove('disabled');
  }
}

function updateUI() {
  // updateTime();
  updateMeter();

  requestAnimationFrame(updateUI);
}

updateUI();

var tempoRange = document.getElementById('tempo__range');
var bpm = document.getElementById('bpm');

tempoRange.addEventListener('input', function(event) {
  var value = event.target.value; // 70 - 140

  Tone.Transport.bpm.value = value;

  bpm.textContent = value;
});

// set initial range value
tempoRange.value = 90;

var KEYCODE_SPACE = 32,
    KEYCODE_G = 71;

document.addEventListener('keydown', function(event) {
  event.preventDefault();

  if (event.keyCode === KEYCODE_SPACE) {
    toggleTransport();
  } else if (event.keyCode === KEYCODE_G) {
    generateMusic();
  }
});
