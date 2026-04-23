import * as React from "react"
import { useGetUsuario, useFollowUser, useGetMe, useGetReceitas, getGetUsuarioQueryKey } from "@workspace/api-client-react"
import { Sidebar } from "@/components/Sidebar"
import { RecipeCard } from "@/components/RecipeCard"
import { RecipeDetailModal } from "@/components/RecipeDetailModal"
import { RecipeFormModal } from "@/components/RecipeFormModal"
import { ReportModal } from "@/components/ReportModal"
import { UserAvatar } from "@/components/UserAvatar"
import { Button } from "@/components/ui/button"
import { Users, ChefHat, UserPlus, UserMinus, Ban } from "lucide-react"
import { useRoute } from "wouter"
import { useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"
import { Receita } from "@workspace/api-client-react/src/generated/api.schemas"

export default function Profile() {
  const [, params] = useRoute("/usuario/:id")
  const userId = parseInt(params?.id || "0")
  
  const { data: currentUser } = useGetMe({ query: { retry: false } })
  const { data: profile, isLoading } = useGetUsuario(userId)
  const { data: receitas, isLoading: receitasLoading } = useGetReceitas({ autorId: userId })
  const { mutate: follow, isPending } = useFollowUser()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const [selectedRecipe, setSelectedRecipe] = React.useState<Receita | null>(null)
  const [editingRecipe, setEditingRecipe] = React.useState<Receita | null>(null)
  const [reportRecipe, setReportRecipe] = React.useState<Receita | null>(null)

  const handleFollow = () => {
    if (!currentUser) return toast({ title: "Login necessário" })
    follow({ userId }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetUsuarioQueryKey(userId) })
    })
  }

  const handleToggleBan = async () => {
    if (!profile) return
    const acao = profile.isBanned ? "desbanir" : "banir"
    if (!confirm(`Tem certeza que deseja ${acao} ${profile.nome}?`)) return
    try {
      const endpoint = profile.isBanned ? "unban" : "ban"
      const r = await fetch(`/api/admin/usuarios/${userId}/${endpoint}`, { method: "POST" })
      if (!r.ok) throw new Error()
      toast({ title: profile.isBanned ? "Usuário desbanido" : "Usuário banido", variant: profile.isBanned ? "default" : "destructive" })
      queryClient.invalidateQueries({ queryKey: getGetUsuarioQueryKey(userId) })
    } catch {
      toast({ title: "Erro ao alterar status", variant: "destructive" })
    }
  }

  const handleDelete = async (recipe: Receita) => {
    if (!confirm(`Excluir "${recipe.titulo}"?`)) return
    try {
      await fetch(`/api/receitas/${recipe.id}`, { method: "DELETE" })
      queryClient.invalidateQueries()
    } catch {
      toast({ title: "Erro ao excluir", variant: "destructive" })
    }
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans">
      <Sidebar 
        user={currentUser}
        search="" setSearch={() => {}}
        activeFeed="recentes" setActiveFeed={() => {}}
        setCategoriaId={() => {}}
        onNewRecipe={() => {}} onNewCategory={() => {}}
      />

      <main className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-12 animate-pulse space-y-8 max-w-5xl mx-auto">
            <div className="h-48 bg-muted rounded-3xl" />
          </div>
        ) : profile ? (
          <div className="max-w-5xl mx-auto p-6 md:p-10">
            {/* Profile card */}
            <div className="bg-card rounded-[3rem] shadow-card border border-border/50 p-10 text-center relative overflow-hidden mb-10">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/20 pointer-events-none" />
              
              <div className="relative z-10 flex flex-col items-center">
                <UserAvatar nome={profile.nome} photoUrl={profile.photoUrl} size="xl" className="mb-6 border-4 border-card shadow-xl" />
                
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-4xl font-display font-bold text-foreground">{profile.nome}</h2>
                  {profile.isBanned && (
                    <span className="text-xs font-bold uppercase tracking-wider bg-destructive/15 text-destructive px-2.5 py-1 rounded-full">Banido</span>
                  )}
                </div>
                <p className="text-muted-foreground mb-8">@{profile.nome.toLowerCase().replace(/\s+/g, '')}</p>

                <div className="flex items-center gap-8 mb-10 text-foreground">
                  <div className="text-center">
                    <div className="text-3xl font-bold font-display">{profile.receitasCount}</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1"><ChefHat className="w-4 h-4"/> Receitas</div>
                  </div>
                  <div className="w-px h-10 bg-border" />
                  <div className="text-center">
                    <div className="text-3xl font-bold font-display">{profile.followersCount}</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1"><Users className="w-4 h-4"/> Seguidores</div>
                  </div>
                  <div className="w-px h-10 bg-border" />
                  <div className="text-center">
                    <div className="text-3xl font-bold font-display">{profile.followingCount}</div>
                    <div className="text-sm text-muted-foreground">Seguindo</div>
                  </div>
                </div>

                {currentUser && currentUser.id !== profile.id && (
                  <div className="flex flex-col items-center gap-3">
                    <Button 
                      size="lg" 
                      variant={profile.isFollowing ? "outline" : "default"}
                      onClick={handleFollow}
                      disabled={isPending}
                      className="w-48 rounded-full shadow-lg"
                    >
                      {profile.isFollowing ? (
                        <><UserMinus className="w-5 h-5 mr-2" /> Deixar de Seguir</>
                      ) : (
                        <><UserPlus className="w-5 h-5 mr-2" /> Seguir Chef</>
                      )}
                    </Button>
                    {currentUser.papel === 'adm' && (
                      <button
                        onClick={handleToggleBan}
                        className="text-xs text-muted-foreground/60 hover:text-destructive flex items-center gap-1.5 transition-colors"
                        data-testid="button-toggle-ban"
                      >
                        <Ban className="w-3 h-3" />
                        {profile.isBanned ? "Desbanir usuário" : "Banir usuário"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Recipes grid */}
            <h3 className="text-2xl font-display font-bold text-foreground mb-6">
              Receitas de {profile.nome.split(" ")[0]}
            </h3>
            
            {receitasLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1,2,3].map(i => <div key={i} className="h-[420px] bg-muted rounded-[2rem] animate-pulse" />)}
              </div>
            ) : receitas && receitas.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {receitas.map(recipe => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    currentUser={currentUser}
                    onClick={() => setSelectedRecipe(recipe)}
                    onEdit={() => setEditingRecipe(recipe)}
                    onDelete={() => handleDelete(recipe)}
                    onReport={() => setReportRecipe(recipe)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-muted-foreground">
                <ChefHat className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">Nenhuma receita ainda.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="p-12 text-center text-2xl font-display font-bold">Usuário não encontrado.</div>
        )}
      </main>

      <RecipeDetailModal
        isOpen={!!selectedRecipe}
        onClose={() => setSelectedRecipe(null)}
        recipe={selectedRecipe}
        currentUser={currentUser}
        onReport={(r) => { setSelectedRecipe(null); setReportRecipe(r); }}
      />
      {editingRecipe && (
        <RecipeFormModal
          isOpen={!!editingRecipe}
          onClose={() => setEditingRecipe(null)}
          recipe={editingRecipe}
        />
      )}
      {reportRecipe && (
        <ReportModal
          isOpen={!!reportRecipe}
          onClose={() => setReportRecipe(null)}
          recipe={reportRecipe}
        />
      )}
    </div>
  )
}
