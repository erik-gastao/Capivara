// Sprites em camadas para compor a Capy dinamicamente.
// Cada grupo é uma camada independente com fundo transparente,
// posicionada sobre a camada anterior.

export const capyBody = {
  normal:   require("../../assets/images/capy-body.png"),
  cesta:    require("../../assets/images/capy-body-cesta.png"),
  pipoca:   require("../../assets/images/capy-body-pipoca.png"),
  sad:      require("../../assets/images/capy-body-sad.png"),
} as const;

export const capyEyes = {
  openNormal: require("../../assets/images/capy-eyes-open-normal.png"),
  openSick:   require("../../assets/images/capy-eyes-open-sick.png"),
  tired:      require("../../assets/images/capy-eyes-tired.png"),
  closed:     require("../../assets/images/capy-eyes-closed.png"),
} as const;

export const capyMouth = {
  normal:    require("../../assets/images/capy-mouth-cheeks-normal.png"),
  happy:     require("../../assets/images/capy-mouth-cheeks-happy.png"),
  veryHappy: require("../../assets/images/capy-mouth-very-happy.png"),
  joke:      require("../../assets/images/capy-mouth-cheeks-joke.png"),
  sick:      require("../../assets/images/capy-mouth-cheeks-sick.png"),
  uau:       require("../../assets/images/capy-mouth-cheeks-uau.png"),
  faceTired: require("../../assets/images/capy-face-tired.png"),
} as const;

// Capy andando com a cesta (quadros de animação)
export const capyWalk = {
  center: require("../../assets/images/capy-com-cesta-move.png"),
  right:  require("../../assets/images/capy-com-cesta-move-D.png"),
  left:   require("../../assets/images/capy-com-cesta-move-E.png"),
} as const;

// Cesta de pinhas (itens de comida, 1 a 5 unidades)
export const cestaPinhas = [
  require("../../assets/images/cestas-pinhas.png"),
  require("../../assets/images/cesta-pinhas-2un.png"),
  require("../../assets/images/cesta-pinhas-3un.png"),
  require("../../assets/images/cesta-pinhas-4un.png"),
  require("../../assets/images/cesta-pinhas-5un.png"),
] as const;

// Acessórios e itens de loja
export const shopAssets = {
  loja:     require("../../assets/images/loja.png"),
  hatBoina: require("../../assets/images/hat-boina.png"),
} as const;

// Ícones de estado
export const statusIcons = {
  sleep: require("../../assets/images/sleep-icon.png"),
} as const;
