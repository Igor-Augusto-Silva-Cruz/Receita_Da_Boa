import * as React from "react"
import { useGetUsuario, useFollowUser, useGetMe, getGetUsuarioQueryKey } from "@workspace/api-client-react"
import { Sidebar } from "@/components/Sidebar"
import { Button } from "@/components/ui/button"
import { Users, ChefHat, UserPlus, UserMinus } from "lucide-react"
import { useRoute } from "wouter"
import { useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"

export default function Profile() {
  const [, params] = useRoute("/usuario/:id")
  const userId = parseInt(params?.id || "0")
  
  const { data: currentUser } = useGetMe({ query: { retry: false } })
  const { data: profile, isLoading } = useGetUsuario(userId)
  const { mutate: follow, isPending } = useFollowUser()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const handleFollow = () => {
    if (!currentUser) return toast({ title: "Login necessário" })
    follow({ userId }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetUsuarioQueryKey(userId) })
    })
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
          <div className="p-12 animate-pulse space-y-8 max-w-4xl mx-auto">
            <div className="h-48 bg-muted rounded-3xl" />
            <div className="h-32 bg-muted rounded-3xl" />
          </div>
        ) : profile ? (
          <div className="max-w-4xl mx-auto p-6 md:p-12">
            <div className="bg-card rounded-[3rem] shadow-card border border-border/50 p-10 md:p-16 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/20 pointer-events-none" />
              
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-primary to-accent text-white flex items-center justify-center text-5xl font-display font-bold shadow-xl mb-6 border-4 border-card">
                  {profile.nome.charAt(0).toUpperCase()}
                </div>
                
                <h2 className="text-4xl font-display font-bold text-foreground mb-2">{profile.nome}</h2>
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
                  <Button 
                    size="lg" 
                    variant={profile.isFollowing ? "outline" : "default"}
                    onClick={handleFollow}
                    isLoading={isPending}
                    className="w-48 rounded-full shadow-lg"
                  >
                    {profile.isFollowing ? (
                      <><UserMinus className="w-5 h-5 mr-2" /> Deixar de Seguir</>
                    ) : (
                      <><UserPlus className="w-5 h-5 mr-2" /> Seguir Chef</>
                    )}
                  </Button>
                )}
              </div>
            </div>
            
            <div className="mt-12 text-center text-muted-foreground">
              <p>As receitas deste chef aparecem no feed principal.</p>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center text-2xl font-display font-bold">Usuário não encontrado.</div>
        )}
      </main>
    </div>
  )
}
