import * as React from "react"
import { Dialog } from "./ui/dialog"
import type { Receita } from "@workspace/api-client-react/src/generated/api.schemas"
import { Clock, ChefHat, Tag } from "lucide-react"

interface Props {
  recipe: Receita | null
  isOpen: boolean
  onClose: () => void
}

export function RecipeDetailModal({ recipe, isOpen, onClose }: Props) {
  if (!recipe) return null;

  {/* default beautiful empty plate if no image */}
  const imgUrl = recipe.urlImagem || `${import.meta.env.BASE_URL}images/empty-plate.png`

  return (
    <Dialog isOpen={isOpen} onClose={onClose} className="max-w-4xl p-0 overflow-hidden bg-background">
      <div className="grid grid-cols-1 md:grid-cols-5 h-full">
        {/* Left Column: Image */}
        <div className="md:col-span-2 relative h-64 md:h-auto bg-muted">
          <img 
            src={imgUrl} 
            alt={recipe.titulo}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent md:bg-gradient-to-r" />
        </div>

        {/* Right Column: Content */}
        <div className="md:col-span-3 p-8 sm:p-10 max-h-[85vh] overflow-y-auto">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            {recipe.categoria && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/15 text-secondary font-medium text-sm">
                <Tag className="w-3.5 h-3.5" />
                {recipe.categoria.nome}
              </span>
            )}
            {recipe.autor && (
              <span className="inline-flex items-center gap-1.5 text-muted-foreground text-sm font-medium">
                <ChefHat className="w-4 h-4" />
                Por {recipe.autor.nome}
              </span>
            )}
          </div>

          <h2 className="text-4xl font-display font-bold text-foreground mb-4 leading-tight">
            {recipe.titulo}
          </h2>
          
          <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
            {recipe.descricao}
          </p>

          <div className="space-y-10">
            <section>
              <h3 className="text-2xl font-display font-semibold mb-5 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm">🥗</span>
                Ingredientes
              </h3>
              <ul className="space-y-3">
                {recipe.ingredientes.split('\n').filter(i => i.trim()).map((ing, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-foreground/80">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <span className="text-base">{ing}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h3 className="text-2xl font-display font-semibold mb-5 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-secondary/10 text-secondary flex items-center justify-center text-sm">👩‍🍳</span>
                Modo de Preparo
              </h3>
              <div className="space-y-6">
                {recipe.instrucoes.split('\n').filter(i => i.trim()).map((step, idx) => {
                  // check if user typed number like "1. do something" to avoid double numbering
                  const cleanStep = step.replace(/^\d+[\.\-]\s*/, '');
                  return (
                    <div key={idx} className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full border-2 border-primary/30 text-primary flex items-center justify-center font-bold text-sm">
                        {idx + 1}
                      </div>
                      <p className="text-base text-foreground/80 pt-1 leading-relaxed">{cleanStep}</p>
                    </div>
                  )
                })}
              </div>
            </section>
          </div>
        </div>
      </div>
    </Dialog>
  )
}
