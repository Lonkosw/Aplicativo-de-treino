/**
 * Gera `assets/seed-exercicios.json` a partir do dataset free-exercise-db
 * (yuhonas/free-exercise-db — domínio público, ~870 exercícios).
 *
 * Rode com:  npm run seed:gerar
 *
 * O arquivo gerado é commitado no repositório e embarcado no APK: o app
 * nunca faz rede. Este script só precisa ser rodado de novo se você quiser
 * atualizar a base ou acrescentar traduções ao dicionário abaixo.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const FONTE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SAIDA = resolve(RAIZ, 'assets/seed-exercicios.json');

type ExercicioBruto = {
  name: string;
  equipment: string | null;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  category: string;
};

// ---------------------------------------------------------------------------
// Dicionários fixos de tradução (sem API externa)
// ---------------------------------------------------------------------------

const MUSCULOS: Record<string, string> = {
  abdominals: 'Abdômen',
  abductors: 'Abdutores',
  adductors: 'Adutores',
  biceps: 'Bíceps',
  calves: 'Panturrilha',
  chest: 'Peito',
  forearms: 'Antebraço',
  glutes: 'Glúteos',
  hamstrings: 'Posterior de coxa',
  lats: 'Dorsal',
  'lower back': 'Lombar',
  'middle back': 'Costas (meio)',
  neck: 'Pescoço',
  quadriceps: 'Quadríceps',
  shoulders: 'Ombros',
  traps: 'Trapézio',
  triceps: 'Tríceps',
};

const EQUIPAMENTOS: Record<string, string> = {
  bands: 'Elástico',
  barbell: 'Barra',
  'body only': 'Peso corporal',
  cable: 'Polia',
  dumbbell: 'Halteres',
  'e-z curl bar': 'Barra W',
  'exercise ball': 'Bola suíça',
  'foam roll': 'Rolo de espuma',
  kettlebells: 'Kettlebell',
  machine: 'Máquina',
  'medicine ball': 'Medicine ball',
  other: 'Outro',
};

const CATEGORIAS: Record<string, string> = {
  cardio: 'Cardio',
  'olympic weightlifting': 'Levantamento olímpico',
  plyometrics: 'Pliometria',
  powerlifting: 'Powerlifting',
  strength: 'Musculação',
  stretching: 'Alongamento',
  strongman: 'Strongman',
};

/**
 * Nomes traduzidos à mão dos exercícios mais comuns de academia.
 * A chave é o nome exato em inglês no dataset. O que não estiver aqui
 * permanece em inglês.
 */
const NOMES: Record<string, string> = {
  // Peito
  'Barbell Bench Press - Medium Grip': 'Supino reto com barra',
  'Barbell Incline Bench Press - Medium Grip': 'Supino inclinado com barra',
  'Decline Barbell Bench Press': 'Supino declinado com barra',
  'Dumbbell Bench Press': 'Supino reto com halteres',
  'Incline Dumbbell Press': 'Supino inclinado com halteres',
  'Decline Dumbbell Bench Press': 'Supino declinado com halteres',
  'Machine Bench Press': 'Supino na máquina',
  'Smith Machine Bench Press': 'Supino no Smith',
  'Close-Grip Barbell Bench Press': 'Supino fechado com barra',
  'Cable Chest Press': 'Supino na polia',
  'Leverage Chest Press': 'Supino máquina articulada',
  'Leverage Incline Chest Press': 'Supino inclinado máquina articulada',
  'Dumbbell Flyes': 'Crucifixo com halteres',
  'Incline Dumbbell Flyes': 'Crucifixo inclinado com halteres',
  'Decline Dumbbell Flyes': 'Crucifixo declinado com halteres',
  Butterfly: 'Voador (peck deck)',
  'Cable Crossover': 'Crossover na polia',
  'Low Cable Crossover': 'Crossover polia baixa',
  Pushups: 'Flexão de braço',
  'Decline Push-Up': 'Flexão declinada',
  'Incline Push-Up': 'Flexão inclinada',
  'Dips - Chest Version': 'Paralelas (peito)',

  // Costas
  'Barbell Deadlift': 'Levantamento terra com barra',
  'Romanian Deadlift': 'Levantamento terra romeno',
  'Stiff-Legged Barbell Deadlift': 'Stiff com barra',
  'Stiff-Legged Dumbbell Deadlift': 'Stiff com halteres',
  'Sumo Deadlift': 'Levantamento terra sumô',
  'Rack Pulls': 'Rack pull (terra parcial)',
  'Bent Over Barbell Row': 'Remada curvada com barra',
  'Bent Over Two-Dumbbell Row': 'Remada curvada com halteres',
  'One-Arm Dumbbell Row': 'Remada unilateral com halter',
  'Seated Cable Rows': 'Remada baixa na polia',
  'T-Bar Row with Handle': 'Remada cavalinho',
  'Lying T-Bar Row': 'Remada cavalinho deitado',
  'Smith Machine Bent Over Row': 'Remada curvada no Smith',
  'Wide-Grip Lat Pulldown': 'Puxada aberta na polia alta',
  'Close-Grip Front Lat Pulldown': 'Puxada fechada na frente',
  'V-Bar Pulldown': 'Puxada com triângulo',
  'Underhand Cable Pulldowns': 'Puxada supinada na polia',
  'Straight-Arm Pulldown': 'Pulldown com braços estendidos',
  Pullups: 'Barra fixa (pronada)',
  'Chin-Up': 'Barra fixa (supinada)',
  'Band Assisted Pull-Up': 'Barra fixa assistida com elástico',
  'Face Pull': 'Face pull',
  'Hyperextensions (Back Extensions)': 'Extensão lombar (banco romano)',
  'Good Morning': 'Bom dia com barra',
  'Barbell Shrug': 'Encolhimento com barra',
  'Dumbbell Shrug': 'Encolhimento com halteres',
  'Cable Shrugs': 'Encolhimento na polia',

  // Ombros
  'Barbell Shoulder Press': 'Desenvolvimento com barra',
  'Dumbbell Shoulder Press': 'Desenvolvimento com halteres',
  'Standing Military Press': 'Desenvolvimento militar em pé',
  'Seated Barbell Military Press': 'Desenvolvimento militar sentado',
  'Machine Shoulder (Military) Press': 'Desenvolvimento na máquina',
  'Arnold Dumbbell Press': 'Desenvolvimento Arnold',
  'Push Press': 'Push press',
  'Side Lateral Raise': 'Elevação lateral com halteres',
  'Seated Side Lateral Raise': 'Elevação lateral sentado',
  'Cable Seated Lateral Raise': 'Elevação lateral na polia',
  'Front Dumbbell Raise': 'Elevação frontal com halteres',
  'Reverse Flyes': 'Crucifixo inverso',
  'Reverse Machine Flyes': 'Crucifixo inverso na máquina',
  'Cable Rear Delt Fly': 'Crucifixo inverso na polia',
  'Seated Bent-Over Rear Delt Raise': 'Elevação posterior sentado',
  'Upright Barbell Row': 'Remada alta com barra',
  'Standing Dumbbell Upright Row': 'Remada alta com halteres',

  // Bíceps
  'Barbell Curl': 'Rosca direta com barra',
  'Dumbbell Bicep Curl': 'Rosca direta com halteres',
  'Alternate Incline Dumbbell Curl': 'Rosca alternada inclinada',
  'Alternate Hammer Curl': 'Rosca martelo alternada',
  'Cross Body Hammer Curl': 'Rosca martelo cruzada',
  'Concentration Curls': 'Rosca concentrada',
  'Preacher Curl': 'Rosca scott com barra',
  'Machine Preacher Curls': 'Rosca scott na máquina',
  'Cable Preacher Curl': 'Rosca scott na polia',
  'Standing Biceps Cable Curl': 'Rosca na polia em pé',
  'Close-Grip EZ Bar Curl': 'Rosca fechada com barra W',
  'Standing Dumbbell Reverse Curl': 'Rosca inversa com halteres',
  'Machine Bicep Curl': 'Rosca na máquina',
  'Spider Curl': 'Rosca spider',

  // Tríceps
  'Triceps Pushdown': 'Tríceps na polia',
  'Triceps Pushdown - Rope Attachment': 'Tríceps corda na polia',
  'Triceps Pushdown - V-Bar Attachment': 'Tríceps barra V na polia',
  'Reverse Grip Triceps Pushdown': 'Tríceps polia pegada supinada',
  'EZ-Bar Skullcrusher': 'Tríceps testa com barra W',
  'Lying Triceps Press': 'Tríceps testa deitado',
  'Cable Rope Overhead Triceps Extension': 'Tríceps francês na polia (corda)',
  'Machine Triceps Extension': 'Tríceps na máquina',
  'Tricep Dumbbell Kickback': 'Tríceps coice com halter',
  'Dips - Triceps Version': 'Paralelas (tríceps)',
  'Bench Dips': 'Tríceps banco',
  'Parallel Bar Dip': 'Mergulho nas paralelas',

  // Pernas
  'Barbell Squat': 'Agachamento livre com barra',
  'Barbell Full Squat': 'Agachamento completo com barra',
  'Front Barbell Squat': 'Agachamento frontal com barra',
  'Bodyweight Squat': 'Agachamento livre (peso corporal)',
  'Dumbbell Squat': 'Agachamento com halteres',
  'Box Squat': 'Agachamento no caixote',
  'Barbell Hack Squat': 'Agachamento hack com barra',
  'Leg Press': 'Leg press',
  'Narrow Stance Leg Press': 'Leg press pegada estreita',
  'Leg Extensions': 'Cadeira extensora',
  'Lying Leg Curls': 'Mesa flexora',
  'Seated Leg Curl': 'Cadeira flexora',
  'Barbell Lunge': 'Afundo com barra',
  'Dumbbell Lunges': 'Afundo com halteres',
  'Barbell Walking Lunge': 'Afundo caminhando com barra',
  'Split Squat with Dumbbells': 'Agachamento búlgaro com halteres',
  'Split Squats': 'Agachamento búlgaro',
  'Barbell Hip Thrust': 'Elevação pélvica com barra',
  'Barbell Glute Bridge': 'Ponte de glúteo com barra',
  'Glute Kickback': 'Coice de glúteo',
  'One-Legged Cable Kickback': 'Coice na polia unilateral',
  'Standing Calf Raises': 'Panturrilha em pé',
  'Seated Calf Raise': 'Panturrilha sentado',
  'Calf Press On The Leg Press Machine': 'Panturrilha no leg press',
  'Donkey Calf Raises': 'Panturrilha burrinho',
  'Smith Machine Calf Raise': 'Panturrilha no Smith',
  'Glute Ham Raise': 'Flexão nórdica (glute ham raise)',
  'Pull Through': 'Pull through na polia',

  // Abdômen
  Crunches: 'Abdominal supra',
  'Cable Crunch': 'Abdominal na polia',
  'Ab Crunch Machine': 'Abdominal na máquina',
  'Decline Crunch': 'Abdominal declinado',
  'Exercise Ball Crunch': 'Abdominal na bola',
  'Hanging Leg Raise': 'Elevação de pernas suspenso',
  'Flat Bench Lying Leg Raise': 'Elevação de pernas no banco',
  'Russian Twist': 'Russian twist',
  Plank: 'Prancha',
  'Push Up to Side Plank': 'Flexão com prancha lateral',
  'Mountain Climbers': 'Escalador',
  'Sit-Up': 'Abdominal completo',
  'Barbell Ab Rollout': 'Rollout com barra',
  'Ab Roller': 'Roda abdominal',

  // Outros
  "Farmer's Walk": 'Caminhada do fazendeiro',
  'Power Clean': 'Power clean',
  'Clean and Jerk': 'Clean and jerk (arremesso)',
  'Power Snatch': 'Power snatch (arranco)',
};

// ---------------------------------------------------------------------------

function traduzirMusculo(m: string) {
  return MUSCULOS[m] ?? m;
}

async function main() {
  console.log('Baixando dataset...');
  const resposta = await fetch(FONTE);
  if (!resposta.ok) throw new Error(`Falha ao baixar: HTTP ${resposta.status}`);
  const bruto = (await resposta.json()) as ExercicioBruto[];
  console.log(`${bruto.length} exercícios recebidos.`);

  // Avisa se alguma chave do dicionário deixou de existir no dataset —
  // assim a tradução não some silenciosamente numa atualização da base.
  const nomesDoDataset = new Set(bruto.map((e) => e.name));
  const orfas = Object.keys(NOMES).filter((n) => !nomesDoDataset.has(n));
  if (orfas.length) {
    console.warn(`Aviso: ${orfas.length} chave(s) sem correspondência: ${orfas.join(', ')}`);
  }

  const vistos = new Set<string>();
  const saida = bruto
    .map((e) => ({
      nome: NOMES[e.name] ?? e.name,
      grupoMuscularPrimario: traduzirMusculo(e.primaryMuscles?.[0] ?? 'other'),
      gruposSecundarios: (e.secondaryMuscles ?? []).map(traduzirMusculo).join(', '),
      equipamento: EQUIPAMENTOS[e.equipment ?? 'other'] ?? 'Outro',
      categoria: CATEGORIAS[e.category] ?? 'Musculação',
    }))
    .filter((e) => {
      const chave = e.nome.toLowerCase();
      if (vistos.has(chave)) return false;
      vistos.add(chave);
      return true;
    })
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

  await mkdir(dirname(SAIDA), { recursive: true });
  await writeFile(SAIDA, JSON.stringify(saida), 'utf8');

  const traduzidos = Object.keys(NOMES).length - orfas.length;
  console.log(`${saida.length} exercícios gravados em assets/seed-exercicios.json`);
  console.log(`${traduzidos} nomes traduzidos para português.`);
}

main().catch((erro) => {
  console.error(erro);
  process.exit(1);
});
