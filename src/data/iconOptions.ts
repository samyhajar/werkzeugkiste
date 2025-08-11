import type { ComponentType, SVGProps } from 'react'
import {
  Briefcase,
  MessageSquare,
  LifeBuoy,
  Globe,
  Book,
  Music4 as Music,
  Shield,
  Wrench,
  Smartphone,
  Laptop,
  Cloud,
  Users,
  GraduationCap,
  Heart,
  Brain,
  Car,
  MapPin,
  ShoppingCart,
  Search,
  Video,
  Camera,
  Link as LinkIcon,
  Star,
  Calendar,
  Bell,
} from 'lucide-react'

export type IconOption = {
  value: string
  label: string
  Icon: ComponentType<SVGProps<SVGSVGElement>>
}

export const iconOptions: IconOption[] = [
  { value: 'briefcase', label: 'Briefcase', Icon: Briefcase },
  { value: 'message-square', label: 'Message', Icon: MessageSquare },
  { value: 'life-buoy', label: 'Life Buoy', Icon: LifeBuoy },
  { value: 'globe', label: 'Globe', Icon: Globe },
  { value: 'book', label: 'Book', Icon: Book },
  { value: 'music', label: 'Music', Icon: Music },
  { value: 'shield', label: 'Shield', Icon: Shield },
  { value: 'wrench', label: 'Wrench', Icon: Wrench },
  { value: 'smartphone', label: 'Smartphone', Icon: Smartphone },
  { value: 'laptop', label: 'Laptop', Icon: Laptop },
  { value: 'cloud', label: 'Cloud', Icon: Cloud },
  { value: 'users', label: 'Users', Icon: Users },
  { value: 'graduation-cap', label: 'Graduation', Icon: GraduationCap },
  { value: 'heart', label: 'Heart', Icon: Heart },
  { value: 'brain', label: 'Brain', Icon: Brain },
  { value: 'car', label: 'Car', Icon: Car },
  { value: 'map-pin', label: 'Map Pin', Icon: MapPin },
  { value: 'shopping-cart', label: 'Cart', Icon: ShoppingCart },
  { value: 'search', label: 'Search', Icon: Search },
  { value: 'video', label: 'Video', Icon: Video },
  { value: 'camera', label: 'Camera', Icon: Camera },
  { value: 'link', label: 'Link', Icon: LinkIcon },
  { value: 'star', label: 'Star', Icon: Star },
  { value: 'calendar', label: 'Calendar', Icon: Calendar },
  { value: 'bell', label: 'Bell', Icon: Bell },
]

export const iconComponentByName = iconOptions.reduce<Record<string, IconOption['Icon']>>(
  (acc, opt) => {
    acc[opt.value] = opt.Icon
    return acc
  },
  {}
)


