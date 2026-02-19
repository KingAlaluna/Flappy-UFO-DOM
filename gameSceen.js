//html елементи
const e = (id) => document.getElementById(id);

const html = {
  gameScene: e('game-scene'),
  containerPillar: e('container-pillar'),
  score: e('score'),
  record: e('record'),
  overScore: e('over-score'),
  overRecord: e('over-record'),
  gameOver: e('game-over'),
  ufo: e('ufo'),
};


//НЛО дані
const ufoData = {
  //фізика
  //падіня
  y: 30,
  velocity: 0,
  gravity: 1,
  jump: -4,
  //повернути
  rotate: 0,
  velRotate: 0,
  jumpRotate: -20,
  
  //інше
  animTime: 0,
  animSpeed: 100,
};


//ігра дані
const gameData = {
  //стати
  score: 0,
  record: JSON.parse(localStorage.getItem('record')) || 0,
  newRecord: false,
  
  //дані гри
  gameOver: 'pause',
  allPilar: [],
  lastTime: 0,
  bgMusic: false,
  fullScreen: false,
  current: 1,
};



//аудіо
class Aud {
  constructor(name) {
    this.audio = new Audio(`audio/${name}.mp3`);
  }
  
  play() {
    this.audio.currentTime = 0;
    this.audio.play();
  }
  
  pause() {
    this.audio.pause();
  }
  
  setVol(v) {
    this.audio.volume = v;
  }
}

const audio = {
  //фонова музика
  bg1: new Aud('bg-1'),
  bg2: new Aud('bg-2'),
  bg3: new Aud('bg-3'),
  
  //ефекти
  score: new Aud('new-score'),
  gameOver: new Aud('game-over'),
};



// гравітація
function physics(dt) {
  //перевірка кінця гри
  if (gameData.gameOver == false) {
    if (ufoData.y >= 90) {
      ufoData.y = 90;
      ufoData.velocity = 0;
      gameOver();
      return;
    }
    
    const ts = dt / 100;
    
    //падіння
    ufoData.velocity += ufoData.gravity * ts;
    ufoData.y += ufoData.velocity * ts;
    //повернути
    ufoData.velRotate += ufoData.gravity * ts;
    ufoData.rotate += ufoData.velRotate * ts;
    
    //політ висота
    if (ufoData.y <= 0) {
      ufoData.y = 0;
      ufoData.velocity = 0;
    }
    
    //перевірка поверненя
    if (ufoData.rotate > 45) {
      ufoData.rotate = 45;
      ufoData.velRotate = 0;
    }
    if (ufoData.rotate < -15) {
      ufoData.rotate = -15;
      ufoData.velRotate = 0;
    }
  }
}


//птах малювати
function ufoDraw(dt) {
  //птах змінення стилів
  const us = html.ufo.style;
  
  us.top = `${ufoData.y}%`;
  us.transform = `rotate(${ufoData.rotate}deg)`;
}



//очки обновити
function newScore() {
  html.score.textContent = `Очки: ${gameData.score}`;
  if (gameData.score > gameData.record) {
    gameData.newRecord = true;
    gameData.record = gameData.score;
    localStorage.setItem('record', JSON.stringify(gameData.record));
  }
  html.record.textContent = `Рекорд: ${gameData.record}`;
  html.overScore.textContent = `Очки: ${gameData.score}`;
  html.overRecord.textContent = `Новий рекорд: ${gameData.newRecord ? gameData.record : 'Ні'}`;
}
newScore();


//шаблон стовпів
class Pillar {
  constructor() {
    //генерація
    this.top = document.createElement('div');
    this.bottom = document.createElement('div');
    
    //класи
    this.top.className = 'pillar top-pillar';
    this.bottom.className = 'pillar';
    
    //стилі
    this.positionTop = ((Math.random() * 40) + 10);
    this.positionBottom = this.positionTop + 40;
    this.top.style.top = `${-60 + this.positionTop}%`;
    this.bottom.style.top = `${this.positionBottom}%`;
    this.rightPosition = -10;
    
    //стан
    this.passed = false;
    this.generation = false;
    html.containerPillar.append(this.top, this.bottom);
  }
}


//генерація стовпів
function pillarGeneration() {
  const pillar = new Pillar();
  gameData.allPilar.push(pillar);
}


//рух стовпів
function pillarMovements(dt) {
  for (let i = gameData.allPilar.length -1; i >= 0; i--) {
    const p = gameData.allPilar[i];
    
    p.rightPosition += 0.05 * dt;
    p.top.style.transform = `translateX(-${p.rightPosition}vmax)`;
    p.bottom.style.transform = `translateX(-${p.rightPosition}vmax)`;
    
    if (p.rightPosition > 50 && !p.generation) {
      p.generation = true;
      pillarGeneration();
    }
    if (p.rightPosition > 110) {
      p.top.remove();
      p.bottom.remove();
      gameData.allPilar.splice(i, 1);
    }
  }
}


//запуск перевірки зіткнень
function checkCollision() {
  const ufoRect = html.ufo.getBoundingClientRect();
  
  gameData.allPilar.forEach(p => {
    const topRect = p.top.getBoundingClientRect();
    const bottomRect = p.bottom.getBoundingClientRect();
    
    if (collisionTrue(ufoRect, topRect)) {
      gameOver();
      return;
    }
    if (collisionTrue(ufoRect, bottomRect)) {
      gameOver();
      return;
    }
  });
}


//перевірка зіткнення
function collisionTrue(rect1, rect2) {
  return !(
    rect1.right < rect2.left ||
    rect1.left > rect2.right ||
    rect1.bottom < rect2.top ||
    rect1.top > rect2.bottom
  );
}


//перевірка очків
function checkScore() {
  gameData.allPilar.forEach(p => {
    if (!p.passed && p.rightPosition > 70) {
      p.passed = true;
      gameData.score ++;
      audio.score.play();
    }
  });
}


//кінець гри
function gameOver() {
  gameData.gameOver = true;
  html.gameOver.style.display = 'flex';
  audio.gameOver.play();
}


//нова гра
function newGame() {
  html.containerPillar.innerHTML = '';
  
  gameData.allPilar = [];
  gameData.score = 0;
  gameData.newRecord = false;
  gameData.lastTime = 0;
  
  ufoData.y = 30;
  ufoData.velocity = 0;
  ufoData.rotate = 0;
  ufoData.velRotate = 0;
  html.ufo.style.top = `${ufoData.y}%`;
  html.ufo.style.transform = `rotate(${ufoData.rotate}deg)`;
  
  html.gameOver.style.display = 'none';
  gameData.gameOver = 'pause';
  
  newScore();
}


//старт гри
function startGame() {
  gameData.gameOver = false;
  pillarGeneration();
  requestAnimationFrame(animationGameScene);
}


//запуск гри
function animationGameScene(currentTime) {
  if (gameData.gameOver || gameData.gameOver == 'pause') {
    gameData.lastTime = 0;
    return;
  }
  
  if (!gameData.lastTime) {
    gameData.lastTime = currentTime;
    requestAnimationFrame(animationGameScene);
    return;
  }
  
  const deltaTime = currentTime - gameData.lastTime;
  gameData.lastTime = currentTime;
  
  checkCollision();
  pillarMovements(deltaTime);
  physics(deltaTime);
  ufoDraw(deltaTime);
  checkScore();
  newScore();
  
  
  requestAnimationFrame(animationGameScene);
}
requestAnimationFrame(animationGameScene);



//клік нова гра або птах політ
html.gameScene.addEventListener('click', () => {
  if (gameData.gameOver == true) {
    newGame();
  } else if (gameData.gameOver == 'pause') {
    startGame();
  } else {
    ufoData.velocity = ufoData.jump;
    ufoData.velRotate = ufoData.jumpRotate;
  }
});


//повноекранний режим
document.documentElement.addEventListener('click', () => {
  if (gameData.fullScreen == false) {
    document.documentElement.requestFullscreen();
    gameData.fullScreen = true;
  }
  
  if (gameData.bgMusic == false) {
    startBgMusic();
    gameData.bgMusic = true;
  }
});



//для фонової музики
function startBgMusic() {
  let track = audio['bg' + gameData.current];


  track.setVol(0.5);
  track.play();


  track.audio.onended = () => {
    if (gameData.current < 3) {
      gameData.current ++;
    } else {
      gameData.current = 1;
    }
    startBgMusic();
  };
}
