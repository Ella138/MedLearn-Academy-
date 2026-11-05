import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';


// ==========================================
// 1. ORGAN INFORMATION
// ==========================================

const organs = {
  brain: {
    name: 'Brain',
    description: 'The brain is the control centre of the nervous system. It receives information, processes it and helps coordinate movement, memory, emotions and many body functions.',
    colour: 0xaa91cf
  },

  heart: {
    name: 'Heart',
    description: 'The heart is a muscular organ that pumps blood through the circulatory system, helping deliver oxygen and nutrients around the body.',
    colour: 0xe45e67
  },

  lungs: {
    name: 'Lungs',
    description: 'The lungs are the main organs of breathing. They allow oxygen to enter the blood and carbon dioxide to leave it.',
    colour: 0x78b9d0
  },

  liver: {
    name: 'Liver',
    description: 'The liver processes nutrients, produces bile and helps break down substances. It has many important roles in metabolism.',
    colour: 0xb98252
  },

  stomach: {
    name: 'Stomach',
    description: 'The stomach stores food temporarily and mixes it with digestive juices to help break food down.',
    colour: 0xe9b65f
  },

  kidneys: {
    name: 'Kidneys',
    description: 'The kidneys filter the blood, remove wastes and extra water to form urine, and help regulate fluid and mineral balance.',
    colour: 0xbd6d82
  }
};

const organKeys = Object.keys(organs);

const topicNames = organKeys.map(key => organs[key].name);

const $ = id => document.getElementById(id);


// ==========================================
// 2. GENERAL WEBSITE SETTINGS
// ==========================================

$('year').textContent = new Date().getFullYear();

$('menuToggle').addEventListener('click', () => {
  $('mainNav').classList.toggle('open');
});

document.querySelectorAll('#mainNav a').forEach(link => {
  link.addEventListener('click', () => {
    $('mainNav').classList.remove('open');
  });
});


// ==========================================
// 3. LEARNING PROGRESS TRACKER
// ==========================================

function getProgress() {
  try {
    return JSON.parse(localStorage.getItem('medlearn-progress')) || {
      quizzes: 0,
      best: 0,
      topics: []
    };
  } catch {
    return {
      quizzes: 0,
      best: 0,
      topics: []
    };
  }
}


function saveProgress(progress) {
  localStorage.setItem(
    'medlearn-progress',
    JSON.stringify(progress)
  );

  renderProgress();
}


function renderProgress() {
  const progress = getProgress();

  $('quizzesCompleted').textContent = progress.quizzes;

  $('bestScore').textContent = `${progress.best}/5`;

  $('topicsStudied').textContent =
    `${progress.topics.length}/6`;

  $('topicCountLabel').textContent =
    `${progress.topics.length} of 6`;

  $('topicList').innerHTML = '';

  topicNames.forEach((name, index) => {

    const label = document.createElement('label');

    label.className = 'topic-item';

    const checkbox = document.createElement('input');

    checkbox.type = 'checkbox';

    checkbox.checked = progress.topics.includes(
      organKeys[index]
    );

    checkbox.addEventListener('change', () => {

      const updatedProgress = getProgress();

      if (checkbox.checked) {

        updatedProgress.topics = [
          ...new Set([
            ...updatedProgress.topics,
            organKeys[index]
          ])
        ];

      } else {

        updatedProgress.topics =
          updatedProgress.topics.filter(
            item => item !== organKeys[index]
          );

      }

      saveProgress(updatedProgress);

    });

    label.append(
      checkbox,
      document.createTextNode(name)
    );

    $('topicList').append(label);

  });
}


renderProgress();


$('resetProgress').addEventListener('click', () => {

  if (confirm('Reset all learning progress saved in this browser?')) {

    saveProgress({
      quizzes: 0,
      best: 0,
      topics: []
    });

  }

});


// ==========================================
// 4. INTERACTIVE ANATOMY DIAGRAM
// ==========================================

function selectOrgan(key) {

  const organ = organs[key];

  if (!organ) return;

  $('organTitle').textContent = organ.name;

  $('organDescription').textContent =
    organ.description;


  // Highlight the selected organ in the diagram.

  document.querySelectorAll('.body-diagram .organ')
    .forEach(element => {

      element.classList.toggle(
        'selected',
        element.dataset.organ === key
      );

    });


  // Highlight the selected organ button.

  document.querySelectorAll('#organButtons button')
    .forEach(button => {

      button.classList.toggle(
        'active',
        button.dataset.organ === key
      );

    });


  // Update the 3D laboratory information.

  document.querySelectorAll('#labButtons button')
    .forEach(button => {

      button.classList.toggle(
        'active',
        button.dataset.organ === key
      );

    });


  $('labOrganTitle').textContent = organ.name;

  $('labOrganText').textContent =
    organ.description;


  // Record that the topic has been explored.

  const progress = getProgress();

  if (!progress.topics.includes(key)) {

    progress.topics.push(key);

    saveProgress(progress);

  }


  // Highlight the selected 3D organ.

  if (threeObjects[key]) {

    Object.values(threeObjects).forEach(model => {

      if (model.material.emissive) {
        model.material.emissive.setHex(0x000000);
      }

    });

    if (threeObjects[key].material.emissive) {
      threeObjects[key].material.emissive.setHex(0x334455);
    }

  }

}


// Create organ selection buttons.

function buildOrganButtons(target) {

  organKeys.forEach(key => {

    const button = document.createElement('button');

    button.textContent = organs[key].name;

    button.dataset.organ = key;

    button.addEventListener('click', () => {
      selectOrgan(key);
    });

    $(target).append(button);

  });

}


buildOrganButtons('organButtons');

buildOrganButtons('labButtons');


// Make the illustrated organs clickable.

document.querySelectorAll('.body-diagram .organ')
  .forEach(element => {

    element.addEventListener('click', () => {

      selectOrgan(element.dataset.organ);

    });

    element.addEventListener('keydown', event => {

      if (event.key === 'Enter' || event.key === ' ') {

        event.preventDefault();

        selectOrgan(element.dataset.organ);

      }

    });

  });


// ==========================================
// 5. THREE-DIMENSIONAL ANATOMY LABORATORY
// ==========================================

const threeObjects = {};

let renderer;
let controls;
let scene;
let camera;
let rotating = true;
let modelGroup;


try {

  const host = $('anatomyCanvas');

  // Create the 3D scene.

  scene = new THREE.Scene();

  scene.background = new THREE.Color(0x172f49);


  // Create the camera.

  camera = new THREE.PerspectiveCamera(
    40,
    host.clientWidth / host.clientHeight,
    0.1,
    100
  );

  camera.position.set(4, 3, 7);


  // Create the renderer.

  renderer = new THREE.WebGLRenderer({
    antialias: true
  });

  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, 2)
  );

  renderer.setSize(
    host.clientWidth,
    host.clientHeight
  );

  host.appendChild(renderer.domElement);


  // Allow the user to rotate the model.

  controls = new OrbitControls(
    camera,
    renderer.domElement
  );

  controls.enableDamping = true;

  controls.target.set(0, 1.3, 0);


  // Add lighting.

  scene.add(
    new THREE.HemisphereLight(
      0xffffff,
      0x506070,
      2
    )
  );

  const light = new THREE.DirectionalLight(
    0xffffff,
    2.2
  );

  light.position.set(4, 7, 5);

  scene.add(light);


  // Create the human body group.

  modelGroup = new THREE.Group();

  scene.add(modelGroup);


  // Create materials.

  function mat(colour) {

    return new THREE.MeshStandardMaterial({
      color: colour,
      roughness: 0.65
    });

  }


  // Create a 3D body part.

  function sphere(
    name,
    x,
    y,
    z,
    sx,
    sy,
    sz,
    colour
  ) {

    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(1, 28, 20),
      mat(colour)
    );

    mesh.position.set(x, y, z);

    mesh.scale.set(sx, sy, sz);

    mesh.userData.organ = name;

    modelGroup.add(mesh);

    if (name) {
      threeObjects[name] = mesh;
    }

    return mesh;

  }


  // BODY STRUCTURE

  // Torso
  sphere(
    null, 0, 1.5, 0,
    0.72, 1.05, 0.38,
    0xc9d9df
  );

  // Neck
  sphere(
    null, 0, 2.8, 0,
    0.3, 0.36, 0.3,
    0xc9d9df
  );

  // Head
  sphere(
    'brain', 0, 3.38, 0,
    0.33, 0.32, 0.3,
    organs.brain.colour
  );

  // Arms
  sphere(
    null, -0.95, 1.55, 0,
    0.22, 0.95, 0.22,
    0xc9d9df
  );

  sphere(
    null, 0.95, 1.55, 0,
    0.22, 0.95, 0.22,
    0xc9d9df
  );

  // Legs
  sphere(
    null, -0.37, 0.15, 0,
    0.25, 1, 0.27,
    0xc9d9df
  );

  sphere(
    null, 0.37, 0.15, 0,
    0.25, 1, 0.27,
    0xc9d9df
  );


  // ORGANS

  // Lungs
  sphere(
    'lungs', -0.25, 2.1, 0.25,
    0.25, 0.42, 0.18,
    organs.lungs.colour
  );

  sphere(
    'lungs', 0.25, 2.1, 0.25,
    0.25, 0.42, 0.18,
    organs.lungs.colour
  );


  // Heart
  sphere(
    'heart', 0, 1.98, 0.42,
    0.17, 0.23, 0.14,
    organs.heart.colour
  );


  // Liver
  sphere(
    'liver', -0.27, 1.48, 0.3,
    0.35, 0.18, 0.17,
    organs.liver.colour
  );


  // Stomach
  sphere(
    'stomach', 0.27, 1.45, 0.3,
    0.2, 0.27, 0.16,
    organs.stomach.colour
  );


  // Kidneys
  sphere(
    'kidneys', -0.34, 1.12, 0.23,
    0.13, 0.23, 0.13,
    organs.kidneys.colour
  );

  sphere(
    'kidneys', 0.34, 1.12, 0.23,
    0.13, 0.23, 0.13,
    organs.kidneys.colour
  );


  // Allow users to select organs in the 3D model.

  const raycaster = new THREE.Raycaster();

  const pointer = new THREE.Vector2();

  renderer.domElement.addEventListener('click', event => {

    const rect = renderer.domElement.getBoundingClientRect();

    pointer.x =
      ((event.clientX - rect.left) / rect.width) * 2 - 1;

    pointer.y =
      -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(pointer, camera);

    const hits = raycaster.intersectObjects(
      modelGroup.children
    );

    const selected = hits.find(
      hit => hit.object.userData.organ
    );

    if (selected) {

      selectOrgan(selected.object.userData.organ);

    }

  });


  // Adjust the 3D model when the screen changes size.

  window.addEventListener('resize', () => {

    if (!renderer) return;

    const width = host.clientWidth;

    const height = host.clientHeight;

    camera.aspect = width / height;

    camera.updateProjectionMatrix();

    renderer.setSize(width, height);

  });


  // Animation.

  function animate() {

    requestAnimationFrame(animate);

    if (rotating) {
      modelGroup.rotation.y += 0.003;
    }

    controls.update();

    renderer.render(scene, camera);

  }

  animate();


} catch (error) {

  $('anatomyCanvas').innerHTML = `
    <p class="tiny" style="padding:24px">
      The 3D viewer could not start. Check that WebGL is enabled
      and that you are connected to the internet, then refresh
      the page.
    </p>
  `;

  console.error(error);

}


// Pause and resume rotation.

$('rotateButton').addEventListener('click', () => {

  rotating = !rotating;

  $('rotateButton').textContent =
    rotating ? 'Pause rotation' : 'Resume rotation';

});


// Reset the camera.

$('resetView').addEventListener('click', () => {

  if (controls) {

    camera.position.set(4, 3, 7);

    controls.target.set(0, 1.3, 0);

    controls.update();

    modelGroup.rotation.set(0, 0, 0);

  }

});


// ==========================================
// 6. MEDICAL FLASHCARDS
// ==========================================

const cards = [

  [
    'ANATOMY',
    'Which organ pumps blood around the body?',
    'The heart. It pumps blood through the circulatory system.'
  ],

  [
    'ANATOMY',
    'Which organ is the main control centre of the nervous system?',
    'The brain.'
  ],

  [
    'RESPIRATION',
    'Where does gas exchange take place in the lungs?',
    'In tiny air sacs called alveoli.'
  ],

  [
    'DIGESTION',
    'Which organ produces bile?',
    'The liver. Bile helps with the digestion of fats.'
  ],

  [
    'EXCRETION',
    'Which organs filter blood to produce urine?',
    'The kidneys.'
  ],

  [
    'BIOLOGY',
    'What is the basic structural and functional unit of life?',
    'The cell.'
  ],

  [
    'CIRCULATION',
    'Which blood cells carry most oxygen?',
    'Red blood cells, using the protein haemoglobin.'
  ],

  [
    'DIGESTION',
    'What is the main role of the stomach?',
    'It stores and mixes food with digestive juices to help digestion.'
  ]

];


let cardOrder = cards.map((_, index) => index);

let cardIndex = 0;

let flipped = false;


function renderCard() {

  const card = cards[cardOrder[cardIndex]];

  $('flashcardTag').textContent = card[0];

  $('flashcardText').textContent =
    flipped ? card[2] : card[1];

  $('flashcardHint').textContent =
    flipped
      ? 'Answer'
      : 'Select the card to reveal the answer.';

  $('flipCard').textContent =
    flipped ? 'Show question' : 'Reveal answer';

  $('cardCount').textContent =
    `Card ${cardIndex + 1} of ${cards.length}`;

}


function flipCard() {

  flipped = !flipped;

  renderCard();

}


// Flip the card by clicking it.

$('flashcard').addEventListener('click', flipCard);

$('flashcard').addEventListener('keydown', event => {

  if (event.key === 'Enter' || event.key === ' ') {

    event.preventDefault();

    flipCard();

  }

});

$('flipCard').addEventListener('click', flipCard);


// Previous card.

$('previousCard').addEventListener('click', () => {

  cardIndex =
    (cardIndex - 1 + cards.length) % cards.length;

  flipped = false;

  renderCard();

});


// Next card.

$('nextCard').addEventListener('click', () => {

  cardIndex =
    (cardIndex + 1) % cards.length;

  flipped = false;

  renderCard();

});


// Shuffle cards.

$('shuffleCards').addEventListener('click', () => {

  for (let i = cardOrder.length - 1; i > 0; i--) {

    const j = Math.floor(Math.random() * (i + 1));

    [cardOrder[i], cardOrder[j]] =
      [cardOrder[j], cardOrder[i]];

  }

  cardIndex = 0;

  flipped = false;

  renderCard();

});

renderCard();


// ==========================================
// 7. MEDICAL KNOWLEDGE QUIZ
// ==========================================

const questions = [

  {
    q: 'Which organ pumps blood around the body?',

    a: [
      'Liver',
      'Heart',
      'Stomach',
      'Kidney'
    ],

    correct: 1,

    why: 'The heart pumps blood through the circulatory system.'
  },

  {
    q: 'What is the main function of the lungs?',

    a: [
      'Filter blood',
      'Digest proteins',
      'Exchange oxygen and carbon dioxide',
      'Produce insulin'
    ],

    correct: 2,

    why: 'The lungs allow oxygen to enter the blood and carbon dioxide to leave it.'
  },

  {
    q: 'Which organs filter blood and produce urine?',

    a: [
      'Kidneys',
      'Lungs',
      'Stomach',
      'Brain'
    ],

    correct: 0,

    why: 'The kidneys filter wastes and extra water from the blood.'
  },

  {
    q: 'Which organ produces bile?',

    a: [
      'Heart',
      'Brain',
      'Liver',
      'Pancreas'
    ],

    correct: 2,

    why: 'The liver produces bile, which helps digest fats.'
  },

  {
    q: 'What is the basic unit of life?',

    a: [
      'Tissue',
      'Cell',
      'Organ',
      'Organ system'
    ],

    correct: 1,

    why: 'Cells are the basic structural and functional units of living organisms.'
  }

];


let qIndex = 0;

let score = 0;

let answered = false;


function renderQuestion() {

  const question = questions[qIndex];

  answered = false;

  $('questionNumber').textContent =
    `QUESTION ${qIndex + 1} OF ${questions.length}`;

  $('quizScore').textContent = `Score: ${score}`;

  $('questionText').textContent = question.q;

  $('quizProgress').style.width =
    `${(qIndex / questions.length) * 100}%`;

  $('quizFeedback').textContent = '';

  $('quizFeedback').className = '';

  $('nextQuestion').disabled = true;

  $('nextQuestion').textContent =
    qIndex === questions.length - 1
      ? 'Finish quiz'
      : 'Next question';

  $('answerOptions').innerHTML = '';


  // Create the answer buttons.

  question.a.forEach((answer, index) => {

    const button = document.createElement('button');

    button.className = 'answer-option';

    button.textContent = answer;

    button.addEventListener('click', () => {

      chooseAnswer(index);

    });

    $('answerOptions').append(button);

  });

}


// Check the selected answer.

function chooseAnswer(index) {

  if (answered) return;

  answered = true;

  const question = questions[qIndex];

  const buttons = [
    ...document.querySelectorAll('.answer-option')
  ];


  buttons.forEach((button, i) => {

    button.disabled = true;

    if (i === question.correct) {

      button.classList.add('correct');

    }

    if (i === index && i !== question.correct) {

      button.classList.add('incorrect');

    }

  });


  if (index === question.correct) {

    score++;

    $('quizFeedback').textContent =
      'Correct! ' + question.why;

    $('quizFeedback').className = 'good';

  } else {

    $('quizFeedback').textContent =
      'Not quite. ' + question.why;

    $('quizFeedback').className = 'bad';

  }


  $('quizScore').textContent = `Score: ${score}`;

  $('nextQuestion').disabled = false;

}


// Finish the quiz.

function finishQuiz() {

  const progress = getProgress();

  progress.quizzes++;

  progress.best = Math.max(
    progress.best,
    score
  );

  saveProgress(progress);


  $('questionNumber').textContent = 'QUIZ COMPLETE';

  $('quizProgress').style.width = '100%';

  $('questionText').textContent =
    `You scored ${score} out of ${questions.length}.`;

  $('answerOptions').innerHTML = '';

  $('quizFeedback').textContent =
    score === 5
      ? 'Excellent work! Keep building your knowledge.'
      : 'Good effort. Review the explanations and try again.';

  $('quizFeedback').className = 'good';

  $('nextQuestion').disabled = true;

}


// Move to the next question.

$('nextQuestion').addEventListener('click', () => {

  if (!answered) return;

  if (qIndex === questions.length - 1) {

    finishQuiz();

    return;

  }

  qIndex++;

  renderQuestion();

});


// Restart the quiz.

$('restartQuiz').addEventListener('click', () => {

  qIndex = 0;

  score = 0;

  renderQuestion();

});


renderQuestion();


// ==========================================
// 8. STUDENT RESEARCH CORNER
// ==========================================

const researchFields = [

  'projectTitle',

  'projectQuestion',

  'projectMethod',

  'projectFindings'

];


// Load previously saved notes.

function loadResearch() {

  try {

    const data = JSON.parse(
      localStorage.getItem('medlearn-research') || '{}'
    );

    researchFields.forEach(id => {

      $(id).value = data[id] || '';

    });

  } catch (error) {

    console.error('Could not load research notes:', error);

  }

}


loadResearch();


// Save research notes.

$('saveResearch').addEventListener('click', () => {

  const data = {};

  researchFields.forEach(id => {

    data[id] = $(id).value;

  });

  localStorage.setItem(
    'medlearn-research',
    JSON.stringify(data)
  );

  $('researchStatus').textContent =
    'Saved on this device. Your notes have not been uploaded or shared.';

});


// Clear research notes.

$('clearResearch').addEventListener('click', () => {

  if (confirm('Clear the research notes saved in this browser?')) {

    researchFields.forEach(id => {

      $(id).value = '';

    });

    localStorage.removeItem('medlearn-research');

    $('researchStatus').textContent =
      'Research notes cleared from this browser.';

  }

});