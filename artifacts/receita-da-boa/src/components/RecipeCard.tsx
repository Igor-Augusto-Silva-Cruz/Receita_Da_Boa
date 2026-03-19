import * as React from "react"
import { Link } from "wouter"
import { Receita, User } from "@workspace/api-client-react/src/generated/api.schemas"
import { Heart, Bookmark, Flag, MoreVertical, Edit2, Trash2 } from "lucide-react"
import { Button } from "./ui/button"
import { UserAvatar } from "./UserAvatar"
import { useLikeReceita, useAddFavorito, useRemoveFavorito, getGetReceitasQueryKey } from "@workspace/api-client-react"
import { useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"
import { motion } from "framer-motion"

interface RecipeCardProps {
  recipe: Receita
  currentUser?: User | null
  onClick: () => void
  onEdit: () => void
  onDelete: () => void
  onReport: () => void
}

export function RecipeCard({ recipe, currentUser, onClick, onEdit, onDelete, onReport }: RecipeCardProps) {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  
  const { mutate: like } = useLikeReceita()
  const { mutate: addFav } = useAddFavorito()
  const { mutate: remFav } = useRemoveFavorito()
  
  const [showActions, setShowActions] = React.useState(false)

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!currentUser) return promptLogin()
    like({ receitaId: recipe.id }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetReceitasQueryKey() }),
      onError: () => toast({ title: "Erro ao curtir", variant: "destructive" })
    })
  }

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!currentUser) return promptLogin()
    if (recipe.isFavorited) {
      remFav({ receitaId: recipe.id }, {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetReceitasQueryKey() })
      })
    } else {
      addFav({ data: { receitaId: recipe.id } }, {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetReceitasQueryKey() })
      })
    }
  }

  const handleAction = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation()
    setShowActions(false)
    action()
  }

  const promptLogin = () => {
    toast({ title: "Login necessário", description: "Entre para interagir com as receitas." })
  }

  const isOwner = currentUser?.id === recipe.autorId
  const isAdmin = currentUser?.papel === "adm"
  const canEdit = isOwner || isAdmin

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group bg-card rounded-[2rem] shadow-card hover:shadow-xl transition-all duration-300 border border-border/40 overflow-hidden cursor-pointer flex flex-col h-[420px]"
      onClick={onClick}
    >
      <div className="relative h-[220px] w-full overflow-hidden bg-muted">
        {recipe.urlImagem ? (
          <img 
            src={recipe.urlImagem} 
            alt={recipe.titulo} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-secondary/10">
            <span className="text-secondary/50 font-display text-2xl font-bold italic">RdB</span>
          </div>
        )}
        
        <div className="absolute top-4 left-4 flex gap-2">
          {recipe.categoria && (
            <span className="glass-panel px-3 py-1.5 rounded-xl text-xs font-bold text-[#ffffff] bg-[#df5d3a]">
              {recipe.categoria.nome}
            </span>
          )}
        </div>
        
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <button 
            onClick={handleFavorite}
            className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md transition-all shadow-sm
              ${recipe.isFavorited ? 'bg-primary text-primary-foreground' : 'bg-white/80 dark:bg-black/50 text-foreground hover:bg-white dark:hover:bg-black'}`}
          >
            <Bookmark className="w-5 h-5" fill={recipe.isFavorited ? "currentColor" : "none"} />
          </button>
        </div>
      </div>
      <div className="p-6 flex flex-col flex-1">
        <div className="flex justify-between items-start gap-4 mb-3">
          <h3 className="text-xl font-display font-bold text-foreground line-clamp-2 leading-tight">
            {recipe.titulo}
          </h3>
          <div className="relative">
            <button 
              onClick={(e) => { e.stopPropagation(); setShowActions(!showActions); }}
              className="p-1.5 text-muted-foreground hover:bg-muted rounded-full transition-colors"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
            
            {showActions && (
              <div className="absolute right-0 top-full mt-1 w-48 glass-panel rounded-xl shadow-lg border border-border py-1 z-10 flex flex-col">
                {canEdit && (
                  <>
                    <button onClick={(e) => handleAction(e, onEdit)} className="w-full px-4 py-2 text-left text-sm font-medium hover:bg-muted flex items-center gap-2">
                      <Edit2 className="w-4 h-4" /> Editar
                    </button>
                    <button onClick={(e) => handleAction(e, onDelete)} className="w-full px-4 py-2 text-left text-sm font-medium hover:bg-destructive/10 text-destructive flex items-center gap-2">
                      <Trash2 className="w-4 h-4" /> Excluir
                    </button>
                  </>
                )}
                {!isOwner && currentUser && (
                  <button onClick={(e) => handleAction(e, onReport)} className="w-full px-4 py-2 text-left text-sm font-medium hover:bg-orange-500/10 text-orange-600 flex items-center gap-2">
                    <Flag className="w-4 h-4" /> Denunciar
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
        
        <p className="text-muted-foreground text-sm line-clamp-2 mb-4 flex-1">
          {recipe.descricao}
        </p>

        <div className="flex items-center justify-between pt-4 border-t border-border/50 mt-auto">
          <Link href={`/usuario/${recipe.autorId}`} onClick={e => e.stopPropagation()} className="flex items-center gap-2 group/author">
            <UserAvatar nome={recipe.autor?.nome} photoUrl={recipe.autor?.photoUrl} size="sm" />
            <span className="text-sm font-medium text-foreground group-hover/author:text-primary transition-colors">
              {recipe.autor?.nome}
            </span>
          </Link>
          
          <button 
            onClick={handleLike}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors text-sm font-bold
              ${recipe.isLiked ? 'bg-red-500/10 text-red-500' : 'bg-primary/10 text-primary/70 hover:bg-red-500/10 hover:text-red-500'}`}
          >
            <Heart className="w-4 h-4" fill={recipe.isLiked ? "currentColor" : "none"} />
            {recipe.likeCount}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
