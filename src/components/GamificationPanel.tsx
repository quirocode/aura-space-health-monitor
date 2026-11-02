import React, { useState } from 'react';
import type { CrewMissionTask } from '../types';
import confetti from 'canvas-confetti';
import { 
  Trophy, 
  Flame, 
  CheckCircle2, 
  Circle, 
  Award, 
  Dumbbell, 
  Droplet, 
  Brain, 
  Activity, 
  Sparkles 
} from 'lucide-react';

export const GamificationPanel: React.FC = () => {
  const [streakDays, setStreakDays] = useState<number>(14);
  const [xp, setXp] = useState<number>(840);
  const [tasks, setTasks] = useState<CrewMissionTask[]>([
    {
      id: 'task_01',
      title: 'Entrenamiento ARED (Pesas en 0g)',
      category: 'exercise',
      targetValue: '4 series sentadillas + peso muerto',
      completed: true,
      xpReward: 150,
      description: 'Preserva densidad ósea (-1.2% mensual prevenido) y masa muscular en fémur.'
    },
    {
      id: 'task_02',
      title: 'Monitoreo Ocular SANS con Ultrasonido',
      category: 'measurement',
      targetValue: 'Medición ONSD < 5.8 mm',
      completed: true,
      xpReward: 100,
      description: 'Verificación de disco óptico y presión intracraneal.'
    },
    {
      id: 'task_03',
      title: 'Protocolo de Hidratación Salina',
      category: 'nutrition',
      targetValue: '2.5 Litros de agua + sales de potasio',
      completed: false,
      xpReward: 80,
      description: 'Previene litiasis renal y mantiene volemia vascular.'
    },
    {
      id: 'task_04',
      title: 'Test de Vigilancia Psicomotora (PVT)',
      category: 'mental',
      targetValue: '3 minutos en tableta',
      completed: false,
      xpReward: 90,
      description: 'Detección de lapsos de atención por fatiga operativa.'
    },
    {
      id: 'task_05',
      title: 'Sincronización Bio-Monitor (Astroskin)',
      category: 'measurement',
      targetValue: 'Descarga de datos de ECG y sueño',
      completed: true,
      xpReward: 70,
      description: 'Actualización del historial biométrico para Houston.'
    }
  ]);

  const toggleTask = (taskId: string) => {
    const updated = tasks.map((t) => {
      if (t.id === taskId) {
        const nextCompleted = !t.completed;
        if (nextCompleted) {
          setXp((prev) => prev + t.xpReward);
        } else {
          setXp((prev) => Math.max(0, prev - t.xpReward));
        }
        return { ...t, completed: nextCompleted };
      }
      return t;
    });

    setTasks(updated);

    // If all tasks completed, trigger celebration!
    const allDone = updated.every((t) => t.completed);
    if (allDone) {
      setStreakDays((prev) => prev + 1);
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#06b6d4', '#10b981', '#f59e0b', '#38bdf8']
      });
    }
  };

  const getCategoryIcon = (cat: CrewMissionTask['category']) => {
    switch (cat) {
      case 'exercise': return <Dumbbell className="w-4 h-4 text-emerald-400" />;
      case 'measurement': return <Activity className="w-4 h-4 text-cyan-400" />;
      case 'nutrition': return <Droplet className="w-4 h-4 text-blue-400" />;
      case 'mental': return <Brain className="w-4 h-4 text-purple-400" />;
    }
  };

  const completedCount = tasks.filter((t) => t.completed).length;
  const progressPercent = Math.round((completedCount / tasks.length) * 100);

  return (
    <div className="hud-panel rounded-xl p-4 border border-cyan-900/60 text-slate-200">
      {/* Header with Streak and Rank */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              RACHA DE SALUD Y PROTOCOLOS DE TRIPULACIÓN
            </h3>
            <p className="text-xs text-slate-400 font-sans">
              Gamificación aeroespacial para adherencia a contramedidas fisiológicas.
            </p>
          </div>
        </div>

        {/* Streak and XP Pills */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-amber-950/70 border border-amber-600/40 px-3 py-1 rounded-lg text-xs font-mono font-bold text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
            <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span>{streakDays} DÍAS EN RACHA</span>
          </div>

          <div className="flex items-center gap-1 bg-cyan-950/70 border border-cyan-500/40 px-3 py-1 rounded-lg text-xs font-mono text-cyan-300">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>{xp} XP</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4 bg-slate-900/80 p-3 rounded-lg border border-slate-800">
        <div className="flex justify-between items-center text-xs font-mono mb-1.5">
          <span className="text-slate-300">Cumplimiento del Día:</span>
          <span className="text-cyan-300 font-bold">{completedCount} de {tasks.length} ({progressPercent}%)</span>
        </div>
        <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-500 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.5)]"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
      </div>

      {/* Checklist Tasks */}
      <div className="space-y-2">
        {tasks.map((task) => (
          <div
            key={task.id}
            onClick={() => toggleTask(task.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleTask(task.id);
              }
            }}
            className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-3 ${
              task.completed
                ? 'bg-slate-900/40 border-slate-800/80 text-slate-400 opacity-90'
                : 'bg-slate-900/80 border-cyan-900/50 hover:border-cyan-600/50 hover:bg-slate-800/60 text-slate-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="text-cyan-400">
                {task.completed ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-600 hover:text-cyan-400" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold ${task.completed ? 'line-through text-slate-500' : 'text-white'}`}>
                    {task.title}
                  </span>
                  <span className="text-[10px] font-mono text-cyan-400/80 bg-cyan-950/40 px-1.5 py-0.5 rounded border border-cyan-800/40">
                    {task.targetValue}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-sans mt-0.5">{task.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {getCategoryIcon(task.category)}
              <span className="text-[10px] font-mono font-bold text-amber-300">+{task.xpReward} XP</span>
            </div>
          </div>
        ))}
      </div>

      {/* Crew Badge Award Footer */}
      <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
        <span className="flex items-center gap-1.5 text-cyan-300">
          <Award className="w-4 h-4 text-cyan-400" />
          Rango Actual: <strong className="text-white">Oficial Médico de Vuelo Artemis</strong>
        </span>
        <span>Próxima recompensa a los 1000 XP</span>
      </div>
    </div>
  );
};
