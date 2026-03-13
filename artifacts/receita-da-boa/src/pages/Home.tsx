import * as React from "react"
import { useGetReceitas, useGetCategorias, useGetFavoritos, useGetMe } from "@workspace/api-client-react"
import type { Receita } from "@workspace/api-client-react/src/generated/api.schemas"
import { Search, ChefHat, Plus, LogIn, LogOut, Heart, LayoutGrid, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/inputs"
import { RecipeCard } from "@/components/RecipeCard"
import { RecipeDetailModal } from "@/components/RecipeDetailModal"
import { RecipeFormModal } from "@/components/RecipeFormModal"
import { CategoryFormModal } from "@/components/CategoryFormModal"
import { cn } from "@/lib/utils"

export default function Home() {
  const { data: user, isLoading: isAuthLoading } = useGetMe({ query: { retry: false } })
  const { data: categories } = useGetCategorias()

  const [search, setSearch] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const [categoriaId, setCategoriaId] = React.useState<number | undefined>(undefined)
  const [viewMode, setViewMode] = React.useState<'all' | 'favorites'>('all')

  // Modals state
  const [selectedRecipe, setSelectedRecipe] = React.useState<Receita | null>(null)
  const [editingRecipe, setEditingRecipe] = React.useState<Receita | null>(null)
  const [isRecipeFormOpen, setIsRecipeFormOpen] = React.useState(false)
  const [isCatFormOpen, setIsCatFormOpen] = React.useState(false)

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  const { data: recipes, isLoading: isRecipesLoading } = useGetReceitas({
    search: debouncedSearch || undefined,
    categoriaId
  }, { query: { enabled: viewMode === 'all' } })

  const { data: favorites, isLoading: isFavsLoading } = useGetFavoritos({ 
    query: { enabled: viewMode === 'favorites' && !!user } 
  })

  const handleLogin = () => {
    window.location.href = "/api/auth/google"
  }

  const handleLogout = () => {
    localStorage.removeItem("receita_token")
    window.location.reload()
  }

  const displayedRecipes = viewMode === 'favorites' ? favorites : recipes
  const isLoading = (viewMode === 'all' ? isRecipesLoading : isFavsLoading) || isAuthLoading
  const isAdmin = user?.papel === "adm"

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans">
      
      {/* SIDEBAR */}
      <aside className="w-80 flex-shrink-0 border-r border-border/50 bg-card/50 backdrop-blur-xl relative hidden md:flex flex-col z-20">
        <div className="absolute inset-0 opacity-20 pointer-events-none mix-blend-multiply" style={{ backgroundImage: `url(${import.meta.env.BASE_URL}images/sidebar-bg.png)`, backgroundSize: 'cover' }} />
        
        <div className="relative p-8 flex flex-col h-full z-10">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/30">
              <ChefHat className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-display font-bold tracking-tight text-foreground">
              Receita da Boa
            </h1>
          </div>

          <div className="space-y-8 flex-1 overflow-y-auto pr-2 pb-6 -mr-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3.5 top-3.5 w-5 h-5 text-muted-foreground" />
              <Input 
                placeholder="Buscar receitas..." 
                className="pl-11 bg-white/50"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3.5 top-3.5 text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Navigation */}
            <div>
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 px-1">Menu</h3>
              <div className="space-y-1">
                <button 
                  onClick={() => setViewMode('all')}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all",
                    viewMode === 'all' ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" : "text-foreground/70 hover:bg-muted hover:text-foreground"
                  )}
                >
                  <LayoutGrid className="w-5 h-5" />
                  Todas as Receitas
                </button>
                {user && (
                  <button 
                    onClick={() => setViewMode('favorites')}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all",
                      viewMode === 'favorites' ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" : "text-foreground/70 hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Heart className="w-5 h-5" />
                    Meus Favoritos
                  </button>
                )}
              </div>
            </div>

            {/* Categories */}
            <div>
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Categorias</h3>
                {isAdmin && (
                  <button onClick={() => setIsCatFormOpen(true)} className="text-primary hover:text-primary/80" title="Nova Categoria">
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="space-y-1">
                <button 
                  onClick={() => setCategoriaId(undefined)}
                  className={cn(
                    "w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
                    !categoriaId ? "bg-secondary/15 text-secondary" : "text-foreground/70 hover:bg-muted"
                  )}
                >
                  Todas
                </button>
                {categories?.map(cat => (
                  <button 
                    key={cat.id}
                    onClick={() => setCategoriaId(cat.id)}
                    className={cn(
                      "w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
                      categoriaId === cat.id ? "bg-secondary/15 text-secondary" : "text-foreground/70 hover:bg-muted"
                    )}
                  >
                    {cat.nome}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* User / Auth */}
          <div className="pt-6 border-t border-border/50 mt-auto">
            {isAuthLoading ? (
              <div className="h-12 bg-muted rounded-xl animate-pulse" />
            ) : user ? (
              <div className="bg-white/60 rounded-2xl p-4 border border-border/50 shadow-sm flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm text-foreground">{user.nome}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user.papel}</p>
                </div>
                <button onClick={handleLogout} className="p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-xl transition-colors">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <Button onClick={handleLogin} className="w-full" size="lg" variant="default">
                <LogIn className="w-5 h-5 mr-2" />
                Entrar com Google
              </Button>
            )}
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-full relative bg-background overflow-hidden z-10">
        <header className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card">
          <div className="flex items-center gap-2">
            <ChefHat className="w-6 h-6 text-primary" />
            <span className="font-display font-bold">Receita da Boa</span>
          </div>
          {user ? (
            <button onClick={handleLogout} className="p-2 text-muted-foreground"><LogOut className="w-5 h-5"/></button>
          ) : (
            <button onClick={handleLogin} className="text-sm font-bold text-primary">Entrar</button>
          )}
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-10">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
              <div>
                <h2 className="text-4xl font-display font-bold text-foreground">
                  {viewMode === 'favorites' ? 'Seus Favoritos' : 'Descubra Novas Receitas'}
                </h2>
                <p className="text-muted-foreground mt-2 text-lg">
                  {viewMode === 'favorites' ? 'As receitas que você mais amou.' : 'Explore sabores incríveis compartilhados pela comunidade.'}
                </p>
              </div>
              
              {isAdmin && viewMode === 'all' && (
                <Button onClick={() => { setEditingRecipe(null); setIsRecipeFormOpen(true); }} size="lg" className="shadow-lg">
                  <Plus className="w-5 h-5 mr-2" />
                  Nova Receita
                </Button>
              )}
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} className="bg-card rounded-3xl h-[400px] border border-border/40 overflow-hidden">
                    <div className="h-48 bg-muted animate-pulse" />
                    <div className="p-6 space-y-4">
                      <div className="h-6 bg-muted rounded animate-pulse w-3/4" />
                      <div className="h-4 bg-muted rounded animate-pulse w-full" />
                      <div className="h-4 bg-muted rounded animate-pulse w-5/6" />
                    </div>
                  </div>
                ))}
              </div>
            ) : displayedRecipes?.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-32 px-4">
                <div className="w-48 h-48 mb-8 opacity-50 grayscale mix-blend-multiply">
                  <img src={`${import.meta.env.BASE_URL}images/empty-plate.png`} alt="Empty" className="w-full h-full object-cover rounded-full" />
                </div>
                <h3 className="text-2xl font-display font-bold text-foreground mb-2">Nenhuma receita encontrada</h3>
                <p className="text-muted-foreground max-w-md">
                  {viewMode === 'favorites' 
                    ? "Você ainda não favoritou nenhuma receita. Que tal explorar e dar coração nas suas preferidas?" 
                    : "Tente mudar os filtros ou busque por outro termo."}
                </p>
                {viewMode === 'favorites' && (
                  <Button onClick={() => setViewMode('all')} variant="outline" className="mt-8">Explorar Receitas</Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {displayedRecipes?.map(recipe => (
                  <RecipeCard 
                    key={recipe.id} 
                    recipe={recipe} 
                    currentUser={user}
                    onClick={() => setSelectedRecipe(recipe)}
                    onEdit={() => { setEditingRecipe(recipe); setIsRecipeFormOpen(true); }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      <RecipeDetailModal 
        isOpen={!!selectedRecipe} 
        onClose={() => setSelectedRecipe(null)} 
        recipe={selectedRecipe} 
      />
      
      {isAdmin && (
        <RecipeFormModal 
          isOpen={isRecipeFormOpen} 
          onClose={() => { setIsRecipeFormOpen(false); setEditingRecipe(null); }} 
          recipeToEdit={editingRecipe} 
        />
      )}

      {isAdmin && (
        <CategoryFormModal
          isOpen={isCatFormOpen}
          onClose={() => setIsCatFormOpen(false)}
        />
      )}
    </div>
  )
}
