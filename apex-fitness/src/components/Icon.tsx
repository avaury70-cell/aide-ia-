/**
 * Icônes : jeu unique Lucide (recommandation du skill — un seul set SVG, jamais d'emoji).
 * On garde une API par nom pour garder les sections lisibles.
 */
import {
  ArrowRight, ScanLine, Gauge, TrendingUp, User, ShieldCheck, Layers, GraduationCap, Megaphone, Wrench,
  LayoutDashboard, Check, TriangleAlert, Heart, Building2, Euro, Download, Menu, X, MapPin, Flame, Trophy,
  Zap, Target, Dumbbell, Users, Smartphone, Sparkles, Clock, HelpCircle, ChevronDown, Play, RotateCcw, type LucideIcon,
} from 'lucide-react';

const MAP: Record<string, LucideIcon> = {
  arrow: ArrowRight, scan: ScanLine, dial: Gauge, chart: TrendingUp, user: User, shield: ShieldCheck, layers: Layers,
  grad: GraduationCap, megaphone: Megaphone, wrench: Wrench, tools: LayoutDashboard, check: Check, alert: TriangleAlert,
  heart: Heart, building: Building2, euro: Euro, download: Download, menu: Menu, close: X, pin: MapPin, flame: Flame,
  trophy: Trophy, zap: Zap, target: Target, dumbbell: Dumbbell, users: Users, phone: Smartphone, sparkles: Sparkles,
  clock: Clock, help: HelpCircle, down: ChevronDown, play: Play, replay: RotateCcw,
};

export default function Icon({ name, size = 22, className = '', strokeWidth = 2.25 }: { name: string; size?: number; className?: string; strokeWidth?: number }) {
  const C = MAP[name] ?? HelpCircle;
  return <C size={size} strokeWidth={strokeWidth} aria-hidden="true" focusable="false" className={className} />;
}
