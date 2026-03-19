import * as React from "react"
import { Link, useLocation } from "wouter"
import { User, Categoria } from "@workspace/api-client-react/src/generated/api.schemas"
import { ChefHat, Search, LayoutGrid, Heart, Flame, Users, ShieldAlert, Plus, LogIn, LogOut, X } from "lucide-react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { UserAvatar } from "./UserAvatar"
import { cn } from "@/lib/utils"

interface Props {
  user?: User | null
  categories?: Categoria[]
  search: string
  setSearch: (v: string) => void
  activeFeed: string
  setActiveFeed: (f: 'recentes' | 'seguindo' | 'populares') => void
  categoriaId?: number
  setCategoriaId: (id?: number) => void
  onNewRecipe: () => void
  onNewCategory: () => void
}

export function Sidebar({ user, categories, search, setSearch, activeFeed, setActiveFeed, categoriaId, setCategoriaId, onNewRecipe, onNewCategory }: Props) {
  const [location] = useLocation()
  
  const handleLogin = () => {
    const loginUrl = `${window.location.origin}/api/auth/google`
    if (window.top && window.top !== window) window.open(loginUrl, "_blank")
    else window.location.href = loginUrl
  }

  const handleLogout = () => {
    localStorage.removeItem("receita_token")
    window.location.reload()
  }

  return (
    <aside className="w-80 flex-shrink-0 border-r border-border/60 bg-card/60 backdrop-blur-2xl relative hidden md:flex flex-col z-20">
      <div className="absolute inset-0 opacity-30 pointer-events-none mix-blend-multiply" style={{ backgroundImage: `url(${import.meta.env.BASE_URL}images/sidebar-bg.png)`, backgroundSize: 'cover' }} />
      
      <div className="relative p-8 flex flex-col h-full z-10">
        <Link href="/" className="flex items-center gap-3 mb-10 hover:opacity-90 transition-opacity">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/30">
            <ChefHat className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold tracking-tight text-foreground leading-none">Receita<br/>da Boa</h1>
          </div>
        </Link>

        <div className="space-y-8 flex-1 overflow-y-auto pr-2 pb-6 -mr-2">
          {/* Action Button */}
          {user && (
            <Button onClick={onNewRecipe} className="w-full shadow-lg shadow-primary/20" size="lg">
              <Plus className="w-5 h-5 mr-2" /> Nova Receita
            </Button>
          )}

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-muted-foreground" />
            <Input 
              placeholder="Buscar receitas..." 
              className="pl-12 bg-accent/50 dark:bg-black/40 border-transparent shadow-inner"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-4 top-3.5 text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Feeds */}
          <div>
            <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-3 px-2">Descobrir</h3>
            <div className="space-y-1">
              <Link href="/">
                <button 
                  onClick={() => setActiveFeed('recentes')}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all",
                    activeFeed === 'recentes' && location === '/' ? "bg-primary text-primary-foreground shadow-md" : "text-foreground/70 hover:bg-muted"
                  )}
                >
                  <LayoutGrid className="w-5 h-5" /> Recentes
                </button>
              </Link>
              <Link href="/">
                <button 
                  onClick={() => setActiveFeed('populares')}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all",
                    activeFeed === 'populares' && location === '/' ? "bg-primary text-primary-foreground shadow-md" : "text-foreground/70 hover:bg-muted"
                  )}
                >
                  <Flame className="w-5 h-5" /> Populares
                </button>
              </Link>
              {user && (
                <Link href="/">
                  <button 
                    onClick={() => setActiveFeed('seguindo')}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all",
                      activeFeed === 'seguindo' && location === '/' ? "bg-primary text-primary-foreground shadow-md" : "text-foreground/70 hover:bg-muted"
                    )}
                  >
                    <Users className="w-5 h-5" /> Seguindo
                  </button>
                </Link>
              )}
            </div>
          </div>

          {/* User Links */}
          {user && (
            <div>
              <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-3 px-2">Sua Conta</h3>
              <div className="space-y-1">
                <Link href={`/usuario/${user.id}`}>
                  <button className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all", location.startsWith('/usuario') ? "bg-secondary text-secondary-foreground shadow-md" : "text-foreground/70 hover:bg-muted")}>
                    <Heart className="w-5 h-5" /> Seu Perfil
                  </button>
                </Link>
                {user.papel === 'adm' && (
                  <Link href="/moderacao">
                    <button className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all", location === '/moderacao' ? "bg-destructive text-destructive-foreground shadow-md" : "text-foreground/70 hover:bg-muted")}>
                      <ShieldAlert className="w-5 h-5" /> Moderação
                    </button>
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Categories */}
          <div>
            <div className="flex items-center justify-between mb-3 px-2">
              <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Categorias</h3>
              {user?.papel === 'adm' && (
                <button onClick={onNewCategory} className="text-primary hover:text-primary/80 transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="space-y-1">
              <Link href="/">
                <button 
                  onClick={() => setCategoriaId(undefined)}
                  className={cn("w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all", !categoriaId && location === '/' ? "bg-primary/10 dark:bg-primary/20 text-primary shadow-sm" : "text-foreground/70 hover:bg-muted")}
                >
                  Todas
                </button>
              </Link>
              {categories?.map(cat => (
                <Link href="/" key={cat.id}>
                  <button 
                    onClick={() => setCategoriaId(cat.id)}
                    className={cn("w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all", categoriaId === cat.id && location === '/' ? "bg-primary/10 dark:bg-primary/20 text-primary shadow-sm" : "text-foreground/70 hover:bg-muted")}
                  >
                    {cat.nome}
                  </button>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* User / Auth */}
        <div className="pt-6 border-t border-border/50 mt-auto">
          {user ? (
            <div className="bg-accent/70 dark:bg-black/40 rounded-2xl p-4 border border-border shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <UserAvatar nome={user.nome} photoUrl={user.photoUrl} size="sm" />
                <div>
                  <p className="font-bold text-sm text-foreground line-clamp-1">{user.nome}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user.papel}</p>
                </div>
              </div>
              <button onClick={handleLogout} className="p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-xl transition-colors">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Button onClick={handleLogin} className="w-full" size="lg">
              <LogIn className="w-5 h-5 mr-2" />
              Entrar com Google
            </Button>
          )}
        </div>
      </div>
    </aside>
  )
}
