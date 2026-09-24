const container = document.getElementById("webgl-container");
const isMobile =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  ) || window.innerWidth < 768;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x060312, 0.008);

const camera = new THREE.PerspectiveCamera(
  isMobile ? 60 : 45,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);

const DEFAULT_CAM_POS = isMobile
  ? new THREE.Vector3(0, 12, 45)
  : new THREE.Vector3(0, 10, 40);
const DEFAULT_CAM_TARGET = new THREE.Vector3(0, 6.0, 0);

camera.position.copy(DEFAULT_CAM_POS);

const renderer = new THREE.WebGLRenderer({
  antialias: !isMobile,
  alpha: false,
  powerPreference: "high-performance",
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25;
container.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxPolarAngle = Math.PI / 2 + 0.05;
controls.minDistance = 8;
controls.maxDistance = 85;
controls.target.copy(DEFAULT_CAM_TARGET);

// LIGHTS
const ambientLight = new THREE.AmbientLight(0x2a103d, 1.4);
scene.add(ambientLight);

const treeLight = new THREE.PointLight(0xffb6c1, 2.5, 45);
treeLight.position.set(0, 8, 0);
scene.add(treeLight);

const warmLight = new THREE.PointLight(0xffaa33, 2.0, 30);
warmLight.position.set(0, -2, 0);
scene.add(warmLight);

// ISLAND
const islandGroup = new THREE.Group();
scene.add(islandGroup);

const islandGeo = new THREE.CylinderGeometry(
  8.5,
  2.2,
  7.5,
  isMobile ? 32 : 48,
  12,
);
const posAttr = islandGeo.attributes.position;
for (let i = 0; i < posAttr.count; i++) {
  const vx = posAttr.getX(i);
  const vy = posAttr.getY(i);
  const vz = posAttr.getZ(i);

  const distFromCenter = Math.sqrt(vx * vx + vz * vz);
  const noise =
    Math.sin(vx * 0.8) * Math.cos(vz * 0.8) * 0.6 +
    Math.sin(vx * 1.8 + vz * 1.5) * 0.3;

  if (vy > 0) {
    posAttr.setY(i, vy + noise * (1.0 - distFromCenter / 12));
  } else {
    posAttr.setX(i, vx + (Math.random() - 0.5) * 1.4);
    posAttr.setZ(i, vz + (Math.random() - 0.5) * 1.4);
  }
}
islandGeo.computeVertexNormals();

const islandMat = new THREE.MeshStandardMaterial({
  color: 0x3d231b,
  roughness: 0.85,
  flatShading: true,
});
const islandMesh = new THREE.Mesh(islandGeo, islandMat);
islandGroup.add(islandMesh);

const topGeo = new THREE.CylinderGeometry(8.6, 7.8, 0.8, isMobile ? 32 : 48, 4);
const topPos = topGeo.attributes.position;
for (let i = 0; i < topPos.count; i++) {
  const vx = topPos.getX(i);
  const vy = topPos.getY(i);
  const vz = topPos.getZ(i);
  const noise = Math.sin(vx * 0.9) * Math.cos(vz * 0.9) * 0.5;
  topPos.setY(i, vy + noise * 0.4);
}
topGeo.computeVertexNormals();
const topMat = new THREE.MeshStandardMaterial({
  color: 0x22130e,
  roughness: 0.9,
  flatShading: true,
});
const topMesh = new THREE.Mesh(topGeo, topMat);
topMesh.position.y = 3.6;
islandGroup.add(topMesh);

// BỆ MẶT ĐÁ NHỎ & ĐÁ TẢNG RẢI RÁC ÍT HƠN
const stoneMat = new THREE.MeshStandardMaterial({
  color: 0x4a4d52,
  roughness: 0.85,
  metalness: 0.1,
  flatShading: true,
});

// 1. Bệ đá nhỏ dẹt ẩn nhẹ dưới gốc cây
const mainStonePlatformGeo = new THREE.CylinderGeometry(2.5, 3.0, 0.15, 6);
const mainStonePlatform = new THREE.Mesh(mainStonePlatformGeo, stoneMat);
mainStonePlatform.position.set(0, 3.9, 0);
islandGroup.add(mainStonePlatform);

// 2. Chỉ 3 viên đá nhỏ điểm xuyết trên mặt đất
const rockCount = 3;
for (let i = 0; i < rockCount; i++) {
  const rockGeo = new THREE.DodecahedronGeometry(0.2 + Math.random() * 0.25, 0);
  const rockMesh = new THREE.Mesh(rockGeo, stoneMat);

  const angle = (i / rockCount) * Math.PI * 2 + 0.5;
  const dist = 3.8 + Math.random() * 2.0;

  rockMesh.position.set(Math.cos(angle) * dist, 3.9, Math.sin(angle) * dist);
  rockMesh.rotation.set(
    Math.random() * Math.PI,
    Math.random() * Math.PI,
    Math.random() * Math.PI,
  );
  islandGroup.add(rockMesh);
}

// TREE TRUNK & BRANCHES
const treeGroup = new THREE.Group();
treeGroup.position.set(0, 4.0, 0);
islandGroup.add(treeGroup);

const trunkMat = new THREE.MeshStandardMaterial({
  color: 0x2b140e,
  roughness: 0.85,
});

const trunkCurve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0, 0, 0),
  new THREE.Vector3(0.15, 2.5, -0.1),
  new THREE.Vector3(-0.1, 5.0, 0.1),
  new THREE.Vector3(0.0, 7.5, 0.0),
]);

const trunkGeo = new THREE.TubeGeometry(trunkCurve, 32, 0.28, 8, false);
const trunkMesh = new THREE.Mesh(trunkGeo, trunkMat);
treeGroup.add(trunkMesh);

const branchClusters = [];
const mainBranchCount = 12;
for (let i = 0; i < mainBranchCount; i++) {
  const angle = (i / mainBranchCount) * Math.PI * 2 + Math.random() * 0.3;
  const h = 3.0 + Math.random() * 4.0;
  const startP = trunkCurve.getPointAt(h / 7.5);
  const len = 3.0 + Math.random() * 2.2;

  const endP = new THREE.Vector3(
    startP.x + Math.cos(angle) * len,
    startP.y + 0.8 + Math.random() * 1.0,
    startP.z + Math.sin(angle) * len,
  );

  const midP = new THREE.Vector3().addVectors(startP, endP).multiplyScalar(0.5);
  midP.y += 0.4;

  const bCurve = new THREE.CatmullRomCurve3([startP, midP, endP]);
  const bGeo = new THREE.TubeGeometry(bCurve, 10, 0.09, 6, false);
  const bMesh = new THREE.Mesh(bGeo, trunkMat);
  treeGroup.add(bMesh);

  branchClusters.push({ center: endP, radius: 3.2 + Math.random() * 1.0 });
}

// HỆ THỐNG TÁN LÁ
const particleCount = isMobile ? 22000 : 38000;
const blossomGeo = new THREE.BufferGeometry();
const blossomPos = new Float32Array(particleCount * 3);
const blossomColors = new Float32Array(particleCount * 3);

const colorDustyPink = new THREE.Color(0xe8a2a8);
const colorSoftPink = new THREE.Color(0xf0b6bc);
const colorPaleRose = new THREE.Color(0xf7d1d5);
const colorSoftWhite = new THREE.Color(0xfdf0f2);

const clusters = [
  { center: new THREE.Vector3(0, 9.5, 0), radius: 6.2 },
  { center: new THREE.Vector3(0, 7.5, 0), radius: 7.0 },
  { center: new THREE.Vector3(0, 5.5, 0), radius: 6.0 },
  ...branchClusters,
];

for (let i = 0; i < particleCount; i++) {
  const c = clusters[Math.floor(Math.random() * clusters.length)];

  const u = Math.random();
  const r = Math.pow(u, 0.65) * c.radius;
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);

  const x = c.center.x + r * Math.sin(phi) * Math.cos(theta);
  const y = c.center.y + r * Math.sin(phi) * Math.sin(theta) * 0.8;
  const z = c.center.z + r * Math.cos(phi);

  blossomPos[i * 3] = x;
  blossomPos[i * 3 + 1] = y;
  blossomPos[i * 3 + 2] = z;

  const heightFactor = THREE.MathUtils.clamp((y - 3) / 7, 0, 1);
  const randC = Math.random();
  let col;

  if (heightFactor < 0.3) {
    col = randC < 0.6 ? colorDustyPink : colorSoftPink;
  } else if (heightFactor < 0.7) {
    col =
      randC < 0.4
        ? colorSoftPink
        : randC < 0.8
          ? colorPaleRose
          : colorDustyPink;
  } else {
    col = randC < 0.5 ? colorSoftWhite : colorPaleRose;
  }

  blossomColors[i * 3] = col.r;
  blossomColors[i * 3 + 1] = col.g;
  blossomColors[i * 3 + 2] = col.b;
}

blossomGeo.setAttribute("position", new THREE.BufferAttribute(blossomPos, 3));
blossomGeo.setAttribute("color", new THREE.BufferAttribute(blossomColors, 3));

function createParticleTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext("2d");
  const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  grad.addColorStop(0, "rgba(255,255,255,0.9)");
  grad.addColorStop(0.4, "rgba(240,182,188,0.6)");
  grad.addColorStop(1, "rgba(240,182,188,0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(16, 16, 16, 0, Math.PI * 2);
  ctx.fill();
  return new THREE.CanvasTexture(canvas);
}

const blossomMat = new THREE.PointsMaterial({
  size: isMobile ? 0.5 : 0.42,
  vertexColors: true,
  map: createParticleTexture(),
  transparent: true,
  opacity: 0.75,
  blending: THREE.NormalBlending,
  depthWrite: false,
});

const blossomParticles = new THREE.Points(blossomGeo, blossomMat);
treeGroup.add(blossomParticles);

// RABBITS
function createRabbit() {
  const group = new THREE.Group();
  const rabbitMat = new THREE.MeshStandardMaterial({
    color: 0xf8f8ff,
    roughness: 0.5,
  });

  const bodyGeo = new THREE.SphereGeometry(0.5, 12, 12);
  bodyGeo.scale(0.8, 1, 0.9);
  const bodyMesh = new THREE.Mesh(bodyGeo, rabbitMat);
  bodyMesh.position.y = 0.4;
  group.add(bodyMesh);

  const headGeo = new THREE.SphereGeometry(0.35, 12, 12);
  const headMesh = new THREE.Mesh(headGeo, rabbitMat);
  headMesh.position.set(0, 0.85, 0.2);
  group.add(headMesh);

  const earGeo = new THREE.CylinderGeometry(0.04, 0.08, 0.5, 8);
  const earLeft = new THREE.Mesh(earGeo, rabbitMat);
  earLeft.position.set(-0.12, 1.25, 0.18);
  earLeft.rotation.z = 0.15;
  earLeft.rotation.x = -0.1;
  group.add(earLeft);

  const earRight = earLeft.clone();
  earRight.position.x = 0.12;
  earRight.rotation.z = -0.15;
  group.add(earRight);

  return group;
}

const rabbits = [];
for (let i = 0; i < 4; i++) {
  const rabbitMesh = createRabbit();
  islandGroup.add(rabbitMesh);

  rabbits.push({
    mesh: rabbitMesh,
    orbitRadius: 2.8 + Math.random() * 3.2,
    orbitSpeed: (0.12 + Math.random() * 0.15) * (i % 2 === 0 ? 1 : -1),
    phase: (i / 4) * Math.PI * 2,
    baseY: 4.05,
    hopSpeed: 4.5 + Math.random() * 2.0,
    hopHeight: 0.15,
    scale: 0.75 + Math.random() * 0.25,
  });
  rabbits[i].mesh.scale.setScalar(rabbits[i].scale);
}

function updateRabbits(time) {
  rabbits.forEach((r) => {
    const angle = r.phase + time * r.orbitSpeed;
    const sign = Math.sign(r.orbitSpeed) || 1;

    const x = Math.cos(angle) * r.orbitRadius;
    const z = Math.sin(angle) * r.orbitRadius;
    const hop = Math.abs(Math.sin(time * r.hopSpeed)) * r.hopHeight;

    r.mesh.position.set(x, r.baseY + hop, z);

    const dx = -Math.sin(angle) * sign;
    const dz = Math.cos(angle) * sign;
    r.mesh.rotation.y = Math.atan2(dx, dz);
  });
}

// LANTERNS & MESSAGES WITH IMAGES
const lanternsGroup = new THREE.Group();
scene.add(lanternsGroup);

const lanterns = [];
const interactiveObjects = [];

const wishList = [
  {
    text: "Thẻo à, nếu nỗi nhớ có hình dáng, chắc lúc này nó đã băng qua bao nhiêu cây số, vừa đến nơi thì ôm vợ iu thật chặt, thật lâu, không buông nữa đâu.",
    img: "./assets/anh (1).jpg",
  },
  {
    text: "Nơi nào đông đúc ngàn ánh đèn cũng thế, anh vẫn chỉ tìm thấy một ánh sáng — là ánh mắt Thẻo khi cười với anh, vợ iu à.",
    img: "./assets/anh (2).jpg",
  },
  {
    text: "Thẻo không cần phải hoàn hảo để được yêu. Chỉ cần Thẻo cứ là Thẻo thôi, thế là anh đã muốn cưới cả đời rồi đấy.",
    img: "./assets/anh (3).jpg",
  },
  {
    text: "Người ta đo khoảng cách bằng cây số. Còn anh, khoảng cách xa nhất của anh là giây phút Thẻo không được ôm anh khi Thẻo khóc. Vợ iu, chịu khó đợi anh một chút nữa thôi.",
    img: "./assets/anh (4).jpg",
  },
  {
    text: "Hôm nay Thẻo có mỏi không? Nếu mỏi thì cứ tựa vào màn hình điện thoại này một chút — đây có phải anh đâu, nhưng nó là thứ gần Thẻo nhất mà lại là của anh, vợ iu à.",
    img: "./assets/anh (5).jpg",
  },
  {
    text: "Nếu bây giờ được ở cạnh Thẻo, anh sẽ nắm tay em đi thật chậm qua từng con phố — để mưa, để gió, và cả người qua đường đều biết: đây là vợ anh, người anh thương nhất trên đời.",
    img: "./assets/anh (6).jpg",
  },
  {
    text: "Cảm ơn Thẻo đã chọn yêu một người ở xa. Em phải gửi nỗi buồn qua tin nhắn, phải tự ôm mình khi ốm, vậy mà em vẫn chưa bao giờ bỏ cuộc. Anh thương cái sự dũng cảm ấy của Thẻo nhất trên đời, vợ iu.",
    img: "./assets/anh (7).jpg",
  },
  {
    text: "Có những tối anh mở tin nhắn Thẻo, chỉ đọc lại những dòng cũ thôi mà mắt đã cay rồi. Không biết Thẻo có giống anh không, vợ iu nhỉ — nhớ mà không được gặp, thương mà chỉ dám nói.",
    img: "./assets/anh (8).jpg",
  },
  {
    text: "Mỗi tối trước khi ngủ, anh vẫn gọi tên Thẻo một lần. Người ta bảo xa mặt cách lòng — với anh thì ngược lại, xa Thẻo càng lâu, lòng anh càng chỉ còn mỗi Thẻo.",
    img: "./assets/anh (9).jpg",
  },
  {
    text: "Thẻo à, anh xin lỗi vì những lần vụng về làm em buồn. Yêu xa buồn lắm đúng không — buồn mà không nắm được tay nhau. Nhưng Thẻo tin anh đi, trái tim anh từ ngày gặp em chưa từng quay lưng lại.",
    img: "./assets/anh (10).jpg",
  },
  {
    text: "Dẫu không thể ở cạnh Thẻo ngay lúc này, trái tim anh vẫn luôn tìm đúng một nơi để trở về: là vợ iu, là nơi ấm nhất mà anh có trên đời.",
    img: "./assets/anh (14).jpg",
  },
  {
    text: "Anh nhớ Thẻo, nhớ giọng nói, nụ cười, và cả những chuyện nhỏ xíu mà chỉ cần Thẻo kể thôi là cả ngày mệt mỏi của anh tan biến. Vợ iu ơi, nhớ em lắm rồi đấy.",
    img: "./assets/anh (15).jpg",
  },
  {
    text: "Anh hứa: mai này về đến bên Thẻo, anh sẽ bù lại từng cái ôm Thẻo đã tự ôm mình, từng bữa cơm Thẻo phải ăn một mình. Mất bao lâu anh cũng đợi được, vì người đợi anh là vợ anh mà.",
    img: "./assets/16.jpg",
  },
  {
    text: "Trăng sáng đêm nay có soi đến cửa nhà Thẻo không? Nếu có, Thẻo nhìn lên đi — ở nơi rất xa ấy có một người cũng đang nhìn mặt trăng đó và gọi tên em, vợ iu của anh.",
    img: "./assets/17.jpg",
  },
  {
    text: "Người ta bảo yêu xa là mệt lắm. Đúng, mệt thật — nhưng cứ nghĩ đến ngày Thẻo chôn mình vào ngực anh, kể hết những ngày giận dỗi và mong chờ, là anh có thêm sức để vượt qua tất cả, Thẻo à.",
    img: "./assets/18.jpg",
  },
  {
    text: "Thẻo ơi, suốt bao nhiêu ngã rẽ của cuộc đời, người anh muốn nắm tay đi đến cuối con đường vẫn chỉ một người thôi. Là Thẻo — là vợ iu của anh. Đừng khóc nữa, anh đang trên đường về phía em đấy.",
    img: "./assets/19.jpg",
  },
];

function createLanternTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  const grad = ctx.createLinearGradient(0, 0, 0, 128);
  grad.addColorStop(0, "#ff4d4d");
  grad.addColorStop(0.5, "#e63946");
  grad.addColorStop(1, "#ffb703");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  ctx.strokeStyle = "#ffd700";
  ctx.lineWidth = 6;
  ctx.strokeRect(4, 4, 120, 120);
  return new THREE.CanvasTexture(canvas);
}

const lanternTex = createLanternTexture();

function createLanternMesh() {
  const group = new THREE.Group();

  const bodyGeo = new THREE.CylinderGeometry(0.6, 0.45, 1.4, 6);
  const bodyMat = new THREE.MeshStandardMaterial({
    map: lanternTex,
    emissive: 0xff7700,
    emissiveIntensity: 0.7,
    roughness: 0.3,
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  group.add(body);

  const capGeo = new THREE.CylinderGeometry(0.63, 0.63, 0.1, 6);
  const capMat = new THREE.MeshStandardMaterial({
    color: 0xffd700,
    metalness: 0.5,
  });
  const capTop = new THREE.Mesh(capGeo, capMat);
  capTop.position.y = 0.7;
  group.add(capTop);

  const tagGeo = new THREE.PlaneGeometry(0.35, 0.7);
  const tagMat = new THREE.MeshBasicMaterial({
    color: 0xd90429,
    side: THREE.DoubleSide,
  });
  const tag = new THREE.Mesh(tagGeo, tagMat);
  tag.position.set(0, -1.1, 0);
  group.add(tag);

  const spriteMat = new THREE.SpriteMaterial({
    map: createParticleTexture(),
    color: 0xffaa00,
    transparent: true,
    opacity: 0.7,
    blending: THREE.AdditiveBlending,
  });
  const glow = new THREE.Sprite(spriteMat);
  glow.scale.set(3.2, 3.2, 1);
  group.add(glow);

  const hitGeo = new THREE.SphereGeometry(1.6, 8, 8);
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });
  const hitMesh = new THREE.Mesh(hitGeo, hitMat);
  group.add(hitMesh);

  return { group, hitMesh };
}

const lanternCount = isMobile ? 24 : 38;
for (let i = 0; i < lanternCount; i++) {
  const { group: lantern, hitMesh } = createLanternMesh();

  const radius = 9 + Math.random() * 25;
  const angle = Math.random() * Math.PI * 2;
  const y = -1 + Math.random() * 30;

  lantern.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);

  const wishData = wishList[Math.floor(Math.random() * wishList.length)];

  lantern.userData = {
    speedY: 0.008 + Math.random() * 0.012,
    swingSpeed: 0.8 + Math.random() * 1.2,
    initialX: lantern.position.x,
    initialZ: lantern.position.z,
    wish: wishData.text,
    imgUrl: wishData.img,
    id: i,
  };

  const sc = 0.75 + Math.random() * 0.5;
  lantern.scale.set(sc, sc, sc);

  hitMesh.userData.parentLantern = lantern;

  lanternsGroup.add(lantern);
  lanterns.push(lantern);
  interactiveObjects.push(hitMesh);
}

// FALLING PETALS & STARS
const fallingPetalsCount = isMobile ? 80 : 180;
const petalsGeo = new THREE.BufferGeometry();
const petalsPos = new Float32Array(fallingPetalsCount * 3);
const petalsData = [];

for (let i = 0; i < fallingPetalsCount; i++) {
  petalsPos[i * 3] = (Math.random() - 0.5) * 36;
  petalsPos[i * 3 + 1] = Math.random() * 36;
  petalsPos[i * 3 + 2] = (Math.random() - 0.5) * 36;

  petalsData.push({
    speedY: 0.02 + Math.random() * 0.03,
  });
}

petalsGeo.setAttribute("position", new THREE.BufferAttribute(petalsPos, 3));
const petalsMat = new THREE.PointsMaterial({
  size: isMobile ? 0.35 : 0.3,
  color: 0xf7d1d5,
  transparent: true,
  opacity: 0.75,
  map: createParticleTexture(),
  blending: THREE.NormalBlending,
  depthWrite: false,
});

const petalsParticles = new THREE.Points(petalsGeo, petalsMat);
scene.add(petalsParticles);

const starCount = isMobile ? 400 : 900;
const starGeo = new THREE.BufferGeometry();
const starPos = new Float32Array(starCount * 3);
for (let i = 0; i < starCount; i++) {
  starPos[i * 3] = (Math.random() - 0.5) * 180;
  starPos[i * 3 + 1] = Math.random() * 90;
  starPos[i * 3 + 2] = (Math.random() - 0.5) * 180;
}
starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
const starMat = new THREE.PointsMaterial({
  color: 0xffffff,
  size: 0.4,
  transparent: true,
  opacity: 0.7,
});
scene.add(new THREE.Points(starGeo, starMat));

// FULL MOON
function createCrescentMoon() {
  const moonGroup = new THREE.Group();
  const moonRadius = 3.2;

  const moonMesh = new THREE.Mesh(
    new THREE.SphereGeometry(moonRadius, 48, 48),
    new THREE.MeshStandardMaterial({
      color: 0xfff6d5,
      emissive: 0xffc966,
      emissiveIntensity: 0.5,
      roughness: 0.45,
      metalness: 0.0,
    }),
  );
  moonGroup.add(moonMesh);

  // Soft inner rim light so the surface doesn't look flat
  const rim = new THREE.PointLight(0xffd98a, 0.6, moonRadius * 4);
  moonGroup.add(rim);

  const glowLayers = [
    { scale: 14, opacity: 0.06 },
    { scale: 10, opacity: 0.1 },
    { scale: 7.5, opacity: 0.14 },
    { scale: 5.4, opacity: 0.2 },
  ];
  glowLayers.forEach(({ scale, opacity }) => {
    const glow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: createParticleTexture(),
        color: 0xffd98a,
        transparent: true,
        opacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    glow.scale.set(scale, scale, 1);
    glow.position.z = -0.18;
    glow.userData.baseOpacity = opacity;
    moonGroup.add(glow);
  });

  // "Seas" (darker patches) so the moon looks organic, not just a plain ball
  const patchCount = 6;
  for (let i = 0; i < patchCount; i++) {
    const patch = new THREE.Mesh(
      new THREE.SphereGeometry(0.5 + Math.random() * 0.55, 16, 16),
      new THREE.MeshStandardMaterial({
        color: 0xf3e0ae,
        emissive: 0xddb25e,
        emissiveIntensity: 0.35,
        roughness: 0.6,
      }),
    );
    // Place patches on the sphere surface, slightly embedded
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.PI * (0.25 + Math.random() * 0.5);
    patch.position.set(
      moonRadius * 0.92 * Math.sin(phi) * Math.cos(theta),
      moonRadius * 0.92 * Math.cos(phi),
      moonRadius * 0.92 * Math.sin(phi) * Math.sin(theta),
    );
    patch.scale.z = 0.4; // flatten so it hugs the surface
    moonGroup.add(patch);
  }

  // Little twinkling stars around the moon
  const moonStars = [];
  for (let i = 0; i < 7; i++) {
    const star = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: createParticleTexture(),
        color: 0xfff6d5,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    const a = Math.random() * Math.PI * 2;
    const r = 5.4 + Math.random() * 3.2;
    star.position.set(Math.cos(a) * r, Math.sin(a) * r, -0.4);
    const s = 0.28 + Math.random() * 0.4;
    star.scale.set(s, s, 1);
    star.userData = {
      phase: Math.random() * Math.PI * 2,
      speed: 0.8 + Math.random() * 1.4,
      baseScale: s,
    };
    moonGroup.add(star);
    moonStars.push(star);
  }
  moonGroup.userData = { glows: moonGroup.children.filter((c) => c.userData.baseOpacity), stars: moonStars };

  moonGroup.position.set(-15, 22, -24);
  moonGroup.rotation.z = 0;
  moonGroup.rotation.y = -0.08;
  scene.add(moonGroup);
  return moonGroup;
}

const crescentMoon = createCrescentMoon();

// FIREWORKS
let fireworks = [];
function createFirework(pos) {
  const pCount = 50;
  const pGeo = new THREE.BufferGeometry();
  const pPositions = new Float32Array(pCount * 3);
  const velocities = [];

  for (let i = 0; i < pCount; i++) {
    pPositions[i * 3] = pos.x;
    pPositions[i * 3 + 1] = pos.y;
    pPositions[i * 3 + 2] = pos.z;

    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    const speed = 0.08 + Math.random() * 0.12;

    velocities.push(
      new THREE.Vector3(
        speed * Math.sin(phi) * Math.cos(theta),
        speed * Math.sin(phi) * Math.sin(theta),
        speed * Math.cos(phi),
      ),
    );
  }

  pGeo.setAttribute("position", new THREE.BufferAttribute(pPositions, 3));
  const pMat = new THREE.PointsMaterial({
    size: 0.35,
    color: 0xffd700,
    transparent: true,
    opacity: 1,
    blending: THREE.AdditiveBlending,
  });

  const pMesh = new THREE.Points(pGeo, pMat);
  scene.add(pMesh);

  fireworks.push({ mesh: pMesh, velocities: velocities, life: 1.0 });
}

// RAYCASTER & INTERACTION
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let targetCamPos = null;
let targetCamTarget = null;
let selectedLantern = null;

const wishModal = document.getElementById("wishModal");
const wishText = document.getElementById("wishText");
const wishImage = document.getElementById("wishImage");
const closeWishBtn = document.getElementById("closeWishBtn");

let pointerDownPos = { x: 0, y: 0 };

function onPointerDown(event) {
  pointerDownPos.x =
    event.clientX || (event.touches && event.touches[0].clientX) || 0;
  pointerDownPos.y =
    event.clientY || (event.touches && event.touches[0].clientY) || 0;
}

function onPointerUp(event) {
  if (event.target.closest(".top-bar") || event.target.closest(".wish-modal"))
    return;

  const clientX =
    event.clientX ||
    (event.changedTouches && event.changedTouches[0].clientX) ||
    0;
  const clientY =
    event.clientY ||
    (event.changedTouches && event.changedTouches[0].clientY) ||
    0;

  const distMoved = Math.hypot(
    clientX - pointerDownPos.x,
    clientY - pointerDownPos.y,
  );
  if (distMoved > 8) return;

  mouse.x = (clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(interactiveObjects, false);

  if (intersects.length > 0) {
    const hitMesh = intersects[0].object;
    selectedLantern = hitMesh.userData.parentLantern || hitMesh.parent;
    const lPos = selectedLantern.position;

    createFirework(lPos);

    const offset = new THREE.Vector3()
      .subVectors(camera.position, lPos)
      .normalize()
      .multiplyScalar(5.5);
    targetCamPos = new THREE.Vector3().addVectors(lPos, offset);
    targetCamTarget = lPos.clone();

    wishText.textContent = `"${selectedLantern.userData.wish}"`;
    wishImage.src = selectedLantern.userData.imgUrl;

    setTimeout(() => {
      wishModal.classList.add("active");
    }, 300);
  }
}

window.addEventListener("pointerdown", onPointerDown, { passive: true });
window.addEventListener("pointerup", onPointerUp, { passive: true });

function resetCamera() {
  targetCamPos = DEFAULT_CAM_POS.clone();
  targetCamTarget = DEFAULT_CAM_TARGET.clone();
  selectedLantern = null;
}

function closeWishCard(e) {
  if (e) {
    e.stopPropagation();
    e.preventDefault();
  }
  wishModal.classList.remove("active");
  resetCamera();
}

closeWishBtn.addEventListener("click", closeWishCard);
closeWishBtn.addEventListener("touchend", closeWishCard);

wishModal.addEventListener("click", (e) => {
  if (e.target === wishModal) closeWishCard(e);
});

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeWishCard();
});

// AUDIO
const bgm = document.getElementById("bgm");
const audioBtn = document.getElementById("audio-btn");
let isPlaying = false;

function updateAudioButton() {
  audioBtn.innerHTML = isPlaying
    ? '<i class="fas fa-volume-up"></i>'
    : '<i class="fas fa-music" style="opacity:0.5;"></i>';
}

function startAudio() {
  bgm
    .play()
    .then(() => {
      isPlaying = true;
      updateAudioButton();
    })
    .catch(() => {
      isPlaying = false;
      updateAudioButton();
    });
}

// Try immediately; if the browser blocks autoplay, retry on EVERY interaction
// (touch, click, key, scroll) until the music actually starts.
startAudio();
["pointerdown", "touchstart", "keydown", "wheel", "scroll"].forEach((evt) =>
  window.addEventListener(
    evt,
    (event) => {
      if (event.target && event.target.closest && event.target.closest("#audio-btn")) return;
      if (!isPlaying) startAudio();
    },
    { passive: true },
  ),
);

audioBtn.addEventListener("click", () => {
  if (isPlaying) {
    bgm.pause();
    isPlaying = false;
    updateAudioButton();
  } else {
    startAudio();
  }
});

// ANIMATION
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  const time = clock.getElapsedTime();

  lanterns.forEach((lantern) => {
    lantern.position.y += lantern.userData.speedY;
    lantern.position.x =
      lantern.userData.initialX +
      Math.sin(time * lantern.userData.swingSpeed + lantern.userData.id) * 0.4;
    lantern.position.z =
      lantern.userData.initialZ +
      Math.cos(time * lantern.userData.swingSpeed + lantern.userData.id) * 0.4;
    lantern.rotation.y += 0.005;

    if (lantern.position.y > 30) {
      lantern.position.y = -3;
    }
  });

  const pPos = petalsGeo.attributes.position.array;
  for (let i = 0; i < fallingPetalsCount; i++) {
    pPos[i * 3 + 1] -= petalsData[i].speedY;
    pPos[i * 3] += Math.sin(time + i) * 0.01;
    pPos[i * 3 + 2] += Math.cos(time + i) * 0.01;

    if (pPos[i * 3 + 1] < -3) {
      pPos[i * 3 + 1] = 30;
      pPos[i * 3] = (Math.random() - 0.5) * 36;
      pPos[i * 3 + 2] = (Math.random() - 0.5) * 36;
    }
  }
  petalsGeo.attributes.position.needsUpdate = true;

  for (let i = fireworks.length - 1; i >= 0; i--) {
    const fw = fireworks[i];
    fw.life -= delta * 1.2;
    const posArr = fw.mesh.geometry.attributes.position.array;

    for (let j = 0; j < fw.velocities.length; j++) {
      posArr[j * 3] += fw.velocities[j].x;
      posArr[j * 3 + 1] += fw.velocities[j].y;
      posArr[j * 3 + 2] += fw.velocities[j].z;
    }
    fw.mesh.geometry.attributes.position.needsUpdate = true;
    fw.mesh.material.opacity = fw.life;

    if (fw.life <= 0) {
      scene.remove(fw.mesh);
      fireworks.splice(i, 1);
    }
  }

  islandGroup.rotation.y = Math.sin(time * 0.15) * 0.05;
  crescentMoon.position.y = 22 + Math.sin(time * 0.18) * 0.12;
  crescentMoon.rotation.z = 0 + Math.sin(time * 0.12) * 0.015;
  crescentMoon.rotation.y = -0.08 + time * 0.05; // slow self-rotation (seas + surface together)

  // Moon glow breathes softly; stars twinkle
  const moonGlows = crescentMoon.userData.glows || [];
  moonGlows.forEach((glow, i) => {
    glow.material.opacity =
      glow.userData.baseOpacity * (0.85 + 0.15 * Math.sin(time * 0.7 + i * 1.3));
  });
  (crescentMoon.userData.stars || []).forEach((star) => {
    const tw = 0.5 + 0.5 * Math.sin(time * star.userData.speed + star.userData.phase);
    star.material.opacity = 0.15 + 0.55 * tw;
    const s = star.userData.baseScale * (0.85 + 0.3 * tw);
    star.scale.set(s, s, 1);
  });

  updateRabbits(time);

  if (targetCamPos && targetCamTarget) {
    camera.position.lerp(targetCamPos, 0.04);
    controls.target.lerp(targetCamTarget, 0.04);

    if (camera.position.distanceTo(targetCamPos) < 0.1) {
      targetCamPos = null;
      targetCamTarget = null;
    }
  }

  controls.update();
  renderer.render(scene, camera);
}

animate();

window.addEventListener("resize", () => {
  const width = window.innerWidth;
  const height = window.innerHeight;

  camera.aspect = width / height;
  camera.fov = width < 768 ? 60 : 45;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, width < 768 ? 1.5 : 2),
  );
});
