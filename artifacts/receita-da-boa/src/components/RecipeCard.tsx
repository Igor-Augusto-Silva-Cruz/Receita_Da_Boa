import * as React from "react"
import { useAddFavorito, useRemoveFavorito, useDeleteReceita, getGetReceitasQueryKey, getGetFavoritosQueryKey } from "@workspace/api-client-react"
import type { Receita, User } from "@workspace/api-client-react/src/generated/api.schemas"
import { useQueryClient } from "@tanstack/react-query"
import { Heart, Edit2, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface Props {
  recipe: Receita
  currentUser: User | undefined
  onClick: () => void
  onEdit: () => void
}

export function RecipeCard({ recipe, currentUser, onClick, onEdit }: Props) {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  
  const { mutate: addFav } = useAddFavorito()
  const { mutate: rmFav } = useRemoveFavorito()
  const { mutate: delRecipe, isPending: isDeleting } = useDeleteReceita()

  const isAdmin = currentUser?.papel === "adm"
  const isLoggedIn = !!currentUser

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isLoggedIn) {
      toast({ title: "Oops!", description: "Faça login para favoritar receitas." })
      return
    }

    const action = recipe.isFavorited ? rmFav : addFav
    const payload = recipe.isFavorited ? { receitaId: recipe.id } : { data: { receitaId: recipe.id } }

    action(payload as any, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetReceitasQueryKey() })
        queryClient.invalidateQueries({ queryKey: getGetFavoritosQueryKey() })
      }
    })
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!window.confirm(`Tem certeza que deseja deletar "${recipe.titulo}"?`)) return
    
    delRecipe({ id: recipe.id }, {
      onSuccess: () => {
        toast({ title: "Receita deletada." })
        queryClient.invalidateQueries({ queryKey: getGetReceitasQueryKey() })
        queryClient.invalidateQueries({ queryKey: getGetFavoritosQueryKey() })
      }
    })
  }

  {/* default beautiful empty plate if no image */}
  const imgUrl = recipe.urlImagem || `${import.meta.env.BASE_URL}images/empty-plate.png`

  return (
    <div 
      onClick={onClick}
      className="group relative bg-card rounded-3xl overflow-hidden cursor-pointer shadow-soft border border-border/40 hover:shadow-xl hover:border-border/80 transition-all duration-300 hover:-translate-y-1 flex flex-col h-full"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img 
          src={imgUrl} 
          alt={recipe.titulo}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60" />
        
        {recipe.categoria && (
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold text-foreground shadow-sm">
            {recipe.categoria.nome}
          </div>
        )}

        <button
          onClick={handleToggleFavorite}
          className={cn(
            "absolute top-4 right-4 p-2.5 rounded-full bg-white/90 backdrop-blur-md shadow-sm transition-transform hover:scale-110 active:scale-95",
            recipe.isFavorited ? "text-primary" : "text-muted-foreground hover:text-primary"
          )}
        >
          <Heart className={cn("w-5 h-5", recipe.isFavorited && "fill-current")} />
        </button>
      </div>

      <div className="p-6 flex-1 flex flex-col">
        <h3 className="text-xl font-display font-bold text-foreground leading-tight mb-2 line-clamp-2">
          {recipe.titulo}
        </h3>
        <p className="text-muted-foreground text-sm line-clamp-2 mb-4 flex-1">
          {recipe.descricao}
        </p>

        <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/50">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {recipe.autor?.nome || "Comunidade"}
          </span>

          {isAdmin && (
            <div className="flex items-center gap-1">
              <button 
                onClick={(e) => { e.stopPropagation(); onEdit(); }}
                className="p-2 text-muted-foreground hover:bg-secondary/10 hover:text-secondary rounded-full transition-colors"
                title="Editar"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button 
                onClick={handleDelete}
                disabled={isDeleting}
                className="p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-full transition-colors disabled:opacity-50"
                title="Deletar"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
