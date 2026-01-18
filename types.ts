
export type ColorMode = 'mono' | 'text' | 'background';

export type Language = 'en' | 'tr';

export type ImageFilter = 'none' | 'blur' | 'sharpen' | 'sepia' | 'grayscale';

export interface AsciiConfig {
  width: number;
  charSet: string;
  invert: boolean;
  contrast: number;
  colorMode: ColorMode;
  filter: ImageFilter;
}

export interface ProcessingResult {
  ascii: string;
  coloredHtml?: string;
  aiComment?: string;
  loading: boolean;
}

export enum CharSets {
  DEFAULT = "@#S%?*+;:,. ",
  MINIMAL = " .:-=+*#%@",
  DETAILED = " .'`^,;!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$",
  BLOCKS = " ░▒▓█",
  PIXEL = " ⣀⣄⣤⣦⣧⣿",
  GEOMETRIC = " ▫▪□▣■",
  BUBBLE = " ○◔◑◕●",
  MATH = " .~=−+∆π∫∑",
  NUMBERS = " 1234567890",
  BINARY = " 01",
  GLITCH = " .`-:;!/>|\\?*#%@$¥£€",
  BRAILLE = " ⠁⠂⠃⠄⠅⠆⠇⠈⠉⠊⠋⠌⠍⠎⠏",
  NATURE = " .`'\"^,-~:;!i?*&@#%✿❀❁",
  CRYSTAL = " .·:;*+xX❖◆■",
  MUSIC = " .-:|♩♪♫♬♭♮♯",
  ARROWS = " .↑↗→↘↓↙←↖↔↕",
  KATAKANA = " ｡｢｣､･ｦｧｨｩｪｫｬｭｮｯｰｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ",
  RUNIC = " ᚠᚢᚦᚨᚱᚲᚺᚾᛁᛃᛈᛇᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟ"
}
