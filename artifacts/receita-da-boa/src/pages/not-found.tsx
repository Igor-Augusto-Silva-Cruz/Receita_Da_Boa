import { Link } from "wouter";
import { ChefHat } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background p-4">
      <div className="w-24 h-24 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mb-8">
        <ChefHat className="w-12 h-12" />
      </div>
      <h1 className="text-6xl font-display font-bold text-foreground mb-4">404</h1>
      <h2 className="text-2xl font-medium text-foreground/80 mb-8">Página não encontrada</h2>
      <p className="text-muted-foreground mb-8 text-center max-w-md">
        Parece que a receita que você está procurando não existe ou foi removida.
      </p>
      <Link href="/">
        <Button size="lg" className="rounded-full px-8">Voltar para a Cozinha</Button>
      </Link>
    </div>
  );
}
