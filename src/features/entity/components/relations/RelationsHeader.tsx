// src/features/entity/components/relations/RelationsHeader.tsx
import {
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface RelationsHeaderProps {
  title: string;
  description: string;
}

/**
 * Header component for relations card
 * Displays title and description
 */
export function RelationsHeader({ title, description }: RelationsHeaderProps) {
  return (
    <CardHeader>
      <CardTitle>{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
  );
}
