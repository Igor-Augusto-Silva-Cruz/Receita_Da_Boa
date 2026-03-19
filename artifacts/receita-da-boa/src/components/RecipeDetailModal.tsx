import * as React from "react"
import { Link } from "wouter"
import { Receita, User, Comentario } from "@workspace/api-client-react/src/generated/api.schemas"
import { Dialog } from "./ui/dialog"
import { UserAvatar } from "./UserAvatar"
import { Heart, Bookmark, Flag, ChefHat, Clock, MessageCircle, Send, Trash2, X } from "lucide-react"
import { Button } from "./ui/button"
import { useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useLikeReceita, useAddFavorito, useRemoveFavorito, getGetReceitasQueryKey, getGetReceitaQueryKey, useGetComentarios, getGetComentariosQueryKey } from "@workspace/api-client-react"

interface Props {
  isOpen: boolean
  onClose: () => void
  recipe: Receita | null
  currentUser?: User | null
  onReport: (recipe: Receita) => void
}

function ReportCommentInline({ comentarioId, onDone }: { comentarioId: number; onDone: () => void }) {
  const [motivo, setMotivo] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const { toast } = useToast()

  const handleSubmit = async () => {
    if (!motivo.trim()) return
    setLoading(true)
    try {
      await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comentarioId, motivo }),
      })
      toast({ title: "Comentário denunciado", description: "Os administradores irão analisar." })
      onDone()
    } catch {
      toast({ title: "Erro ao denunciar", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-2 p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-xl space-y-2">
      <p className="text-xs font-semibold text-orange-700 dark:text-orange-400">Por que está denunciando?</p>
      <textarea
        value={motivo}
        onChange={e => setMotivo(e.target.value)}
        placeholder="Descreva o problema..."
        rows={2}
        className="w-full text-sm bg-accent/40 dark:bg-black/40 border border-border rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-orange-400"
      />
      <div className="flex gap-2 justify-end">
        <button onClick={onDone} className="text-xs text-muted-foreground hover:text-foreground px-2">Cancelar</button>
        <button onClick={handleSubmit} disabled={!motivo.trim() || loading} className="text-xs bg-orange-500 text-white px-3 py-1 rounded-lg disabled:opacity-50">
          {loading ? "..." : "Denunciar"}
        </button>
      </div>
    </div>
  )
}

function CommentItem({ comment, currentUser, receitaId }: { comment: Comentario; currentUser?: User | null; receitaId: number }) {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [showReport, setShowReport] = React.useState(false)

  const isOwn = currentUser?.id === comment.userId
  const isAdmin = currentUser?.papel === "adm"

  const handleDelete = async () => {
    if (!confirm("Excluir este comentário?")) return
    try {
      await fetch(`/api/comentarios/${comment.id}/delete`, { method: "POST" })
      queryClient.invalidateQueries({ queryKey: getGetComentariosQueryKey(receitaId) })
    } catch {
      toast({ title: "Erro ao excluir", variant: "destructive" })
    }
  }

  return (
    <div className="flex gap-3 group">
      <UserAvatar nome={comment.autor?.nome} photoUrl={comment.autor?.photoUrl} size="sm" className="flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="bg-muted/60 rounded-2xl px-4 py-3">
          <div className="flex items-center gap-2 mb-1">
            <Link href={`/usuario/${comment.userId}`} className="text-sm font-bold text-foreground hover:text-primary transition-colors">
              {comment.autor?.nome ?? "Usuário"}
            </Link>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: ptBR })}
            </span>
          </div>
          <p className="text-sm text-foreground/80 leading-relaxed break-words">{comment.texto}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {(isOwn || isAdmin) && (
            <button onClick={handleDelete} className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors">
              <Trash2 className="w-3 h-3" /> Excluir
            </button>
          )}
          {!isOwn && currentUser && !showReport && (
            <button onClick={() => setShowReport(true)} className="text-xs text-muted-foreground hover:text-orange-500 flex items-center gap-1 transition-colors">
              <Flag className="w-3 h-3" /> Denunciar
            </button>
          )}
        </div>

        {showReport && <ReportCommentInline comentarioId={comment.id} onDone={() => setShowReport(false)} />}
      </div>
    </div>
  )
}

export function RecipeDetailModal({ isOpen, onClose, recipe, currentUser, onReport }: Props) {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [newComment, setNewComment] = React.useState("")
  const [posting, setPosting] = React.useState(false)
  const commentEndRef = React.useRef<HTMLDivElement>(null)

  const { mutate: like } = useLikeReceita()
  const { mutate: addFav } = useAddFavorito()
  const { mutate: remFav } = useRemoveFavorito()

  const { data: comentarios = [], isLoading: comentariosLoading } = useGetComentarios(
    recipe?.id ?? 0,
    { query: { enabled: !!recipe?.id && isOpen } }
  )

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
        }
      })
    } else {
      addFav({ data: { receitaId: recipe.id } }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetReceitasQueryKey() })
        }
      })
    }
  }

  const handlePostComment = async () => {
    if (!newComment.trim() || !currentUser) return
    setPosting(true)
    try {
      await fetch(`/api/comentarios/${recipe.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texto: newComment.trim() }),
      })
      setNewComment("")
      queryClient.invalidateQueries({ queryKey: getGetComentariosQueryKey(recipe.id) })
      setTimeout(() => commentEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100)
    } catch {
      toast({ title: "Erro ao comentar", variant: "destructive" })
    } finally {
      setPosting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handlePostComment()
    }
  }

  const promptLogin = () => toast({ title: "Login necessário" })

  return (
    <Dialog isOpen={isOpen} onClose={onClose} className="max-w-5xl p-0 overflow-hidden bg-background">
      <div className="flex flex-col md:flex-row h-full max-h-[90vh]">
        {/* Left Side: Image + info */}
        <div className="md:w-2/5 flex flex-col shrink-0 overflow-y-auto">
          <div className="relative h-64 md:h-72 bg-muted shrink-0">
            {recipe.urlImagem ? (
              <img src={recipe.urlImagem} alt={recipe.titulo} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-secondary/10 text-secondary/40">
                <ChefHat className="w-16 h-16 mb-4" />
                <span className="font-display text-xl font-bold">Sem imagem</span>
              </div>
            )}
            <div className="absolute top-4 left-4">
              {recipe.categoria && (
                <span className="px-3 py-1.5 rounded-full text-xs font-bold text-white bg-[#df5d3a]">
                  {recipe.categoria.nome}
                </span>
              )}
            </div>
          </div>

          <div className="p-6 flex flex-col gap-6 flex-1">
            <div>
              <h2 className="text-2xl font-display font-bold text-foreground mb-2 leading-tight">{recipe.titulo}</h2>
              <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
                <Link href={`/usuario/${recipe.autorId}`} onClick={onClose} className="flex items-center gap-2 hover:text-primary transition-colors font-medium text-foreground">
                  <UserAvatar nome={recipe.autor?.nome} photoUrl={recipe.autor?.photoUrl} size="xs" />
                  {recipe.autor?.nome}
                </Link>
                <span>•</span>
                <span>{formatDistanceToNow(new Date(recipe.createdAt), { addSuffix: true, locale: ptBR })}</span>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={handleLike} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold transition-colors ${recipe.isLiked ? 'bg-red-500/10 text-red-500' : 'bg-muted text-muted-foreground hover:bg-red-500/10 hover:text-red-500'}`}>
                  <Heart className="w-4 h-4" fill={recipe.isLiked ? "currentColor" : "none"} /> {recipe.likeCount}
                </button>
                <button onClick={handleFavorite} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold transition-colors ${recipe.isFavorited ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary'}`}>
                  <Bookmark className="w-4 h-4" fill={recipe.isFavorited ? "currentColor" : "none"} /> Salvar
                </button>
                {currentUser && currentUser.id !== recipe.autorId && (
                  <button onClick={() => onReport(recipe)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm bg-muted text-muted-foreground hover:bg-orange-500/10 hover:text-orange-500 transition-colors">
                    <Flag className="w-4 h-4" /> Denunciar
                  </button>
                )}
              </div>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">{recipe.descricao}</p>

            <div>
              <h3 className="font-display font-bold mb-3 flex items-center gap-2 text-sm">
                <span className="w-6 h-6 rounded-md bg-primary/10 text-primary flex items-center justify-center"><ChefHat className="w-3.5 h-3.5"/></span>
                Ingredientes
              </h3>
              <ul className="space-y-2">
                {recipe.ingredientes.split('\n').filter(i => i.trim()).map((ing, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-foreground/80">
                    <span className="mt-2 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    <span className="leading-relaxed">{ing}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-display font-bold mb-3 flex items-center gap-2 text-sm">
                <span className="w-6 h-6 rounded-md bg-secondary/10 text-secondary flex items-center justify-center"><Clock className="w-3.5 h-3.5"/></span>
                Modo de Preparo
              </h3>
              <div className="space-y-4">
                {recipe.instrucoes.split('\n').filter(i => i.trim()).map((step, idx) => {
                  const isNumbered = /^\d+[\.\)]/.test(step);
                  const text = isNumbered ? step.replace(/^\d+[\.\)]\s*/, '') : step;
                  return (
                    <div key={idx} className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center font-bold text-xs text-muted-foreground shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <p className="text-sm text-foreground/80 leading-relaxed pt-0.5">{text}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Comments */}
        <div className="flex-1 flex flex-col border-t md:border-t-0 md:border-l border-border min-h-0">
          <div className="px-6 py-4 border-b border-border flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-display font-bold text-foreground">
              Comentários
              {comentarios.length > 0 && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">({comentarios.length})</span>
              )}
            </h3>
          </div>

          {/* Comments list */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {comentariosLoading ? (
              <div className="space-y-4">
                {[1,2,3].map(i => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="w-8 h-8 rounded-full bg-muted shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded-lg w-1/3" />
                      <div className="h-10 bg-muted rounded-2xl" />
                    </div>
                  </div>
                ))}
              </div>
            ) : comentarios.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="font-medium">Seja o primeiro a comentar!</p>
                <p className="text-sm mt-1">Compartilhe sua experiência com esta receita.</p>
              </div>
            ) : (
              comentarios.map(c => (
                <CommentItem key={c.id} comment={c} currentUser={currentUser} receitaId={recipe.id} />
              ))
            )}
            <div ref={commentEndRef} />
          </div>

          {/* Comment input */}
          <div className="p-4 border-t border-border bg-muted/20">
            {currentUser ? (
              <div className="flex gap-3 items-end">
                <UserAvatar nome={currentUser.nome} photoUrl={currentUser.photoUrl} size="sm" className="flex-shrink-0 mb-1" />
                <div className="flex-1 relative">
                  <textarea
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Escreva um comentário... (Enter para enviar)"
                    rows={1}
                    className="w-full bg-accent/40 dark:bg-black/40 border border-border rounded-2xl px-4 py-3 pr-12 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40 leading-relaxed"
                    style={{ minHeight: "44px", maxHeight: "120px" }}
                    onInput={e => {
                      const el = e.currentTarget
                      el.style.height = "auto"
                      el.style.height = Math.min(el.scrollHeight, 120) + "px"
                    }}
                  />
                  <button
                    onClick={handlePostComment}
                    disabled={!newComment.trim() || posting}
                    className="absolute right-3 bottom-3 w-7 h-7 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-center text-sm text-muted-foreground py-2">
                <button onClick={onClose} className="text-primary font-medium hover:underline">Entre</button> para comentar
              </p>
            )}
          </div>
        </div>
      </div>
    </Dialog>
  )
}
