import {
  Briefcase,
  Bus,
  DotsThreeCircle,
  FirstAid,
  ForkKnife,
  House,
  Laptop,
  Lightning,
  PawPrint,
  Storefront,
  Ticket,
  Tote,
  type Icon,
} from '@phosphor-icons/react'
import type { CategoryIcon as CategoryIconName } from '../db/types'

const icons: Record<CategoryIconName, Icon> = {
  food: ForkKnife,
  transport: Bus,
  home: House,
  services: Lightning,
  health: FirstAid,
  fun: Ticket,
  shopping: Tote,
  pets: PawPrint,
  salary: Briefcase,
  freelance: Laptop,
  sales: Storefront,
  other: DotsThreeCircle,
}

export function CategoryGlyph({
  icon,
  size = 16,
  weight = 'bold',
  className,
}: {
  icon: CategoryIconName
  size?: number
  weight?: 'regular' | 'bold' | 'fill'
  className?: string
}) {
  const Component = icons[icon] ?? DotsThreeCircle
  return <Component size={size} weight={weight} className={className} aria-hidden="true" />
}
