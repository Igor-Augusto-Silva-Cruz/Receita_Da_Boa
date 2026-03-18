import * as React from "react"
import { Dialog } from "./ui/dialog"
import { Input, Textarea } from "./ui/input"
import { Button } from "./ui/button"
import { useCreateReceita, useUpdateReceita, getGetReceitasQueryKey, getGetReceitaQueryKey, useGetCategorias } from "@workspace/api-client-react"
import { useQueryClient } from "@tanstack/react-query"
import { UtensilsCrossed } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Receita, CreateReceitaInput } from "@workspace/api-client-react/src/generated/api.schemas"

interface Props {
  isOpen: boolean
  onClose: () => void
  recipeToEdit?: Receita | null
}

export function RecipeFormModal({ isOpen, onClose, recipeToEdit }: Props) {
  const [formData, setFormData] = React.useState<CreateReceitaInput>({
    titulo: "",
    descricao: "",
    ingredientes: "",
    instrucoes: "",
    urlImagem: "",
    categoriaId: null
  })

  const { data: categories } = useGetCategorias()
  const { mutate: create, isPending: isCreating } = useCreateReceita()
  const { mutate: update, isPending: isUpdating } = useUpdateReceita()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  React.useEffect(() => {
    if (recipeToEdit) {
      setFormData({
        titulo: recipeToEdit.titulo,
        descricao: recipeToEdit.descricao,
        ingredientes: recipeToEdit.ingredientes,
        instrucoes: recipeToEdit.instrucoes,
        urlImagem: recipeToEdit.urlImagem || "",
        categoriaId: recipeToEdit.categoriaId
      })
    } else {
      setFormData({ titulo: "", descricao: "", ingredientes: "", instrucoes: "", urlImagem: "", categoriaId: null })
    }
  }, [recipeToEdit, isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload = { ...formData }
    if (!payload.urlImagem?.trim()) payload.urlImagem = null

    if (recipeToEdit) {
      update({ id: recipeToEdit.id, data: payload }, {
        onSuccess: () => {
          toast({ title: "Receita atualizada!" })
          queryClient.invalidateQueries({ queryKey: getGetReceitasQueryKey() })
          queryClient.invalidateQueries({ queryKey: getGetReceitaQueryKey(recipeToEdit.id) })
          onClose()
        },
        onError: (err) => toast({ title: "Erro", description: err.error || "Falha", variant: "destructive" })
      })
    } else {
      create({ data: payload }, {
        onSuccess: () => {
          toast({ title: "Receita publicada com sucesso!" })
          queryClient.invalidateQueries({ queryKey: getGetReceitasQueryKey() })
          onClose()
        },
        onError: (err) => toast({ title: "Erro", description: err.error || "Falha", variant: "destructive" })
      })
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'categoriaId' ? (value ? parseInt(value) : null) : value 
    }))
  }

  return (
    <Dialog isOpen={isOpen} onClose={onClose} className="max-w-3xl">
      <div className="p-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <UtensilsCrossed className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-3xl font-display font-bold text-foreground">
              {recipeToEdit ? "Editar Receita" : "Nova Receita da Boa"}
            </h2>
            <p className="text-muted-foreground mt-1">Compartilhe seus segredos culinários com a comunidade.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-2 text-foreground/80">Título da Receita <span className="text-primary">*</span></label>
                <Input required name="titulo" value={formData.titulo} onChange={handleChange} placeholder="Ex: Bolo de Cenoura" />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2 text-foreground/80">Categoria</label>
                <select 
                  name="categoriaId" 
                  value={formData.categoriaId || ""} 
                  onChange={handleChange}
                  className="flex w-full rounded-xl border-2 border-border bg-card px-4 py-3 text-base text-foreground shadow-sm focus-visible:outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/10"
                >
                  <option value="">Selecione...</option>
                  {categories?.map(c => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold mb-2 text-foreground/80">URL da Imagem</label>
                <Input name="urlImagem" value={formData.urlImagem || ""} onChange={handleChange} placeholder="https://..." />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold mb-2 text-foreground/80">Breve Descrição <span className="text-primary">*</span></label>
              <Textarea required name="descricao" value={formData.descricao} onChange={handleChange} className="h-[216px]" placeholder="Conte um pouco sobre a história dessa receita..." />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold mb-2 text-foreground/80">Ingredientes <span className="text-primary">*</span></label>
              <Textarea required name="ingredientes" value={formData.ingredientes} onChange={handleChange} placeholder="1 xícara de farinha&#10;2 ovos&#10;..." className="min-h-[200px]" />
              <p className="text-xs text-muted-foreground mt-2">Um ingrediente por linha.</p>
            </div>
            <div>
              <label className="block text-sm font-bold mb-2 text-foreground/80">Modo de Preparo <span className="text-primary">*</span></label>
              <Textarea required name="instrucoes" value={formData.instrucoes} onChange={handleChange} placeholder="1. Misture tudo&#10;2. Asse por 40 min&#10;..." className="min-h-[200px]" />
              <p className="text-xs text-muted-foreground mt-2">Um passo por linha.</p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-border/50">
            <Button type="button" variant="ghost" onClick={onClose} size="lg">Cancelar</Button>
            <Button type="submit" isLoading={isCreating || isUpdating} size="lg">
              {recipeToEdit ? "Salvar Alterações" : "Publicar Receita"}
            </Button>
          </div>
        </form>
      </div>
    </Dialog>
  )
}
