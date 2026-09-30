// 118 elementos: [número atômico, símbolo, nome em português, categoria]
// Categorias: am (metal alcalino), at (alcalino-terroso), mt (metal de transição),
// mp (outros metais), sm (semimetal), nm (não metal), ha (halogênio),
// gn (gás nobre), la (lantanídeo), ac (actinídeo), dc (desconhecida)
const ELEMENTOS = [
  [1,'H','Hidrogênio','nm'],[2,'He','Hélio','gn'],[3,'Li','Lítio','am'],[4,'Be','Berílio','at'],
  [5,'B','Boro','sm'],[6,'C','Carbono','nm'],[7,'N','Nitrogênio','nm'],[8,'O','Oxigênio','nm'],
  [9,'F','Flúor','ha'],[10,'Ne','Neônio','gn'],[11,'Na','Sódio','am'],[12,'Mg','Magnésio','at'],
  [13,'Al','Alumínio','mp'],[14,'Si','Silício','sm'],[15,'P','Fósforo','nm'],[16,'S','Enxofre','nm'],
  [17,'Cl','Cloro','ha'],[18,'Ar','Argônio','gn'],[19,'K','Potássio','am'],[20,'Ca','Cálcio','at'],
  [21,'Sc','Escândio','mt'],[22,'Ti','Titânio','mt'],[23,'V','Vanádio','mt'],[24,'Cr','Cromo','mt'],
  [25,'Mn','Manganês','mt'],[26,'Fe','Ferro','mt'],[27,'Co','Cobalto','mt'],[28,'Ni','Níquel','mt'],
  [29,'Cu','Cobre','mt'],[30,'Zn','Zinco','mt'],[31,'Ga','Gálio','mp'],[32,'Ge','Germânio','sm'],
  [33,'As','Arsênio','sm'],[34,'Se','Selênio','nm'],[35,'Br','Bromo','ha'],[36,'Kr','Criptônio','gn'],
  [37,'Rb','Rubídio','am'],[38,'Sr','Estrôncio','at'],[39,'Y','Ítrio','mt'],[40,'Zr','Zircônio','mt'],
  [41,'Nb','Nióbio','mt'],[42,'Mo','Molibdênio','mt'],[43,'Tc','Tecnécio','mt'],[44,'Ru','Rutênio','mt'],
  [45,'Rh','Ródio','mt'],[46,'Pd','Paládio','mt'],[47,'Ag','Prata','mt'],[48,'Cd','Cádmio','mt'],
  [49,'In','Índio','mp'],[50,'Sn','Estanho','mp'],[51,'Sb','Antimônio','sm'],[52,'Te','Telúrio','sm'],
  [53,'I','Iodo','ha'],[54,'Xe','Xenônio','gn'],[55,'Cs','Césio','am'],[56,'Ba','Bário','at'],
  [57,'La','Lantânio','la'],[58,'Ce','Cério','la'],[59,'Pr','Praseodímio','la'],[60,'Nd','Neodímio','la'],
  [61,'Pm','Promécio','la'],[62,'Sm','Samário','la'],[63,'Eu','Európio','la'],[64,'Gd','Gadolínio','la'],
  [65,'Tb','Térbio','la'],[66,'Dy','Disprósio','la'],[67,'Ho','Hólmio','la'],[68,'Er','Érbio','la'],
  [69,'Tm','Túlio','la'],[70,'Yb','Itérbio','la'],[71,'Lu','Lutécio','la'],[72,'Hf','Háfnio','mt'],
  [73,'Ta','Tântalo','mt'],[74,'W','Tungstênio','mt'],[75,'Re','Rênio','mt'],[76,'Os','Ósmio','mt'],
  [77,'Ir','Irídio','mt'],[78,'Pt','Platina','mt'],[79,'Au','Ouro','mt'],[80,'Hg','Mercúrio','mt'],
  [81,'Tl','Tálio','mp'],[82,'Pb','Chumbo','mp'],[83,'Bi','Bismuto','mp'],[84,'Po','Polônio','mp'],
  [85,'At','Astato','ha'],[86,'Rn','Radônio','gn'],[87,'Fr','Frâncio','am'],[88,'Ra','Rádio','at'],
  [89,'Ac','Actínio','ac'],[90,'Th','Tório','ac'],[91,'Pa','Protactínio','ac'],[92,'U','Urânio','ac'],
  [93,'Np','Netúnio','ac'],[94,'Pu','Plutônio','ac'],[95,'Am','Amerício','ac'],[96,'Cm','Cúrio','ac'],
  [97,'Bk','Berquélio','ac'],[98,'Cf','Califórnio','ac'],[99,'Es','Einstênio','ac'],[100,'Fm','Férmio','ac'],
  [101,'Md','Mendelévio','ac'],[102,'No','Nobélio','ac'],[103,'Lr','Laurêncio','ac'],[104,'Rf','Rutherfórdio','mt'],
  [105,'Db','Dúbnio','mt'],[106,'Sg','Seabórgio','mt'],[107,'Bh','Bóhrio','mt'],[108,'Hs','Hássio','mt'],
  [109,'Mt','Meitnério','dc'],[110,'Ds','Darmstádio','dc'],[111,'Rg','Roentgênio','dc'],[112,'Cn','Copernício','mt'],
  [113,'Nh','Nihônio','dc'],[114,'Fl','Fleróvio','dc'],[115,'Mc','Moscóvio','dc'],[116,'Lv','Livermório','dc'],
  [117,'Ts','Tenessino','dc'],[118,'Og','Oganessônio','dc'],
];

// Posição (linha, coluna) de cada elemento na grade 18 x 10.
// Linhas 9 e 10 são lantanídeos e actinídeos, separados do corpo da tabela.
function posicao(z) {
  if (z === 1) return [1, 1];
  if (z === 2) return [1, 18];
  if (z <= 4) return [2, z - 2];
  if (z <= 10) return [2, z + 8];
  if (z <= 12) return [3, z - 10];
  if (z <= 18) return [3, z];
  if (z <= 36) return [4, z - 18];
  if (z <= 54) return [5, z - 36];
  if (z <= 56) return [6, z - 54];
  if (z <= 71) return [9, z - 53];
  if (z <= 86) return [6, z - 68];
  if (z <= 88) return [7, z - 86];
  if (z <= 103) return [10, z - 85];
  return [7, z - 100];
}

// Nomes alternativos também aceitos como resposta
const SINONIMOS = {
  7: ['Azoto'], 33: ['Arsênico'], 36: ['Kriptônio'], 74: ['Volfrâmio', 'Wolfrâmio'],
  85: ['Ástato'], 99: ['Einstênio', 'Einsteínio'], 113: ['Nipônio'],
};

// Normaliza a resposta: sem acento, sem espaço, minúscula ("Hélio " -> "helio")
function normalizar(texto) {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '').toLowerCase();
}
