import * as React from "react"
import { Link } from "wouter"
import { Receita, User } from "@workspace/api-client-react/src/generated/api.schemas"
import { Dialog } from "./ui/dialog"
import { Heart, Bookmark, Flag, ChefHat, Clock, Users } from "lucide-react"
import { Button } from "./ui/button"
import { useLikeReceita, useAddFavorito, useRemoveFavorito, getGetReceitasQueryKey, getGetReceitaQueryKey } from "@workspace/api-client-react"
import { useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Props {
  isOpen: boolean
  onClose: () => void
  recipe: Receita | null
  currentUser?: User | null
  onReport: (recipe: Receita) => void
}

export function RecipeDetailModal({ isOpen, onClose, recipe, currentUser, onReport }: Props) {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  
  const { mutate: like } = useLikeReceita()
  const { mutate: addFav } = useAddFavorito()
  const { mutate: remFav } = useRemoveFavorito()

  if (!recipe) return null

  const handleLike = () => {
    if (!currentUser) return promptLogin()
    like({ receitaId: recipe.id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetReceitasQueryKey() })
        queryClient.invalidateQueries({ queryKey: getGetReceitaQueryKey(recipe.id) })
      }
    })
  }

  const handleFavorite = () => {
    if (!currentUser) return promptLogin()
    if (recipe.isFavorited) {
      remFav({ receitaId: recipe.id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetReceitasQueryKey() })
          queryClient.invalidateQueries({ queryKey: getGetReceitaQueryKey(recipe.id) })
        }
      })
    } else {
      addFav({ data: { receitaId: recipe.id } }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetReceitasQueryKey() })
          queryClient.invalidateQueries({ queryKey: getGetReceitaQueryKey(recipe.id) })
        }
      })
    }
  }

  const promptLogin = () => toast({ title: "Login necessário" })

  return (
    <Dialog isOpen={isOpen} onClose={onClose} className="max-w-4xl p-0 overflow-hidden bg-background">
      <div className="flex flex-col md:flex-row h-full max-h-[85vh]">
        {/* Left Side: Image */}
        <div className="md:w-2/5 relative h-64 md:h-auto bg-muted shrink-0">
          {recipe.urlImagem ? (
             <img src={recipe.urlImagem} alt={recipe.titulo} className="w-full h-full object-cover" />
          ) : (
             <div className="w-full h-full flex flex-col items-center justify-center bg-secondary/10 text-secondary/40">
               <ChefHat className="w-16 h-16 mb-4" />
               <span className="font-display text-xl font-bold">Sem imagem</span>
             </div>
          )}
          <div className="absolute top-6 left-6 flex gap-2">
             {recipe.categoria && (
               <span className="glass-panel px-4 py-1.5 rounded-full text-sm font-bold text-foreground">
                 {recipe.categoria.nome}
               </span>
             )}
          </div>
        </div>

        {/* Right Side: Content */}
        <div className="flex-1 overflow-y-auto p-8 md:p-10">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h2 className="text-4xl font-display font-bold text-foreground mb-4 leading-tight">{recipe.titulo}</h2>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <Link href={`/usuario/${recipe.autorId}`} onClick={onClose} className="flex items-center gap-2 hover:text-primary transition-colors font-medium text-foreground">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white text-[10px]">
                    {recipe.autor?.nome?.charAt(0).toUpperCase()}
                  </div>
                  {recipe.autor?.nome}
                </Link>
                <span>•</span>
                <span>{formatDistanceToNow(new Date(recipe.createdAt), { addSuffix: true, locale: ptBR })}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="glass" size="icon" onClick={handleLike} className={recipe.isLiked ? "text-red-500" : ""}>
                <Heart className="w-5 h-5" fill={recipe.isLiked ? "currentColor" : "none"} />
              </Button>
              <Button variant="glass" size="icon" onClick={handleFavorite} className={recipe.isFavorited ? "text-primary" : ""}>
                <Bookmark className="w-5 h-5" fill={recipe.isFavorited ? "currentColor" : "none"} />
              </Button>
            </div>
          </div>

          <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
            {recipe.descricao}
          </p>

          <div className="grid md:grid-cols-2 gap-10">
            <div>
              <h3 className="text-xl font-display font-bold mb-6 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center"><ChefHat className="w-4 h-4"/></span>
                Ingredientes
              </h3>
              <ul className="space-y-3">
                {recipe.ingredientes.split('\n').filter(i => i.trim()).map((ing, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-foreground/80">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    <span className="leading-relaxed">{ing}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-display font-bold mb-6 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center"><Clock className="w-4 h-4"/></span>
                Preparo
              </h3>
              <div className="space-y-6">
                {recipe.instrucoes.split('\n').filter(i => i.trim()).map((step, idx) => {
                  const isNumbered = /^\d+[\.\)]/.test(step);
                  const text = isNumbered ? step.replace(/^\d+[\.\)]\s*/, '') : step;
                  return (
                    <div key={idx} className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-bold text-sm text-muted-foreground shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <p className="text-foreground/80 leading-relaxed pt-1">{text}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {currentUser && currentUser.id !== recipe.autorId && (
            <div className="mt-12 pt-6 border-t border-border/50 flex justify-end">
              <Button variant="ghost" className="text-orange-500 hover:text-orange-600 hover:bg-orange-500/10" onClick={() => onReport(recipe)}>
                <Flag className="w-4 h-4 mr-2" /> Reportar problema
              </Button>
            </div>
          )}
        </div>
      </div>
    </Dialog>
  )
}
