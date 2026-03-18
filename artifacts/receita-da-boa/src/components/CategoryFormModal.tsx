import * as React from "react"
import { Dialog } from "./ui/dialog"
import { Input } from "./ui/input"
import { Button } from "./ui/button"
import { useCreateCategoria, getGetCategoriasQueryKey } from "@workspace/api-client-react"
import { useQueryClient } from "@tanstack/react-query"
import { Tags } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function CategoryFormModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [nome, setNome] = React.useState("")
  const { mutate, isPending } = useCreateCategoria()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutate({ data: { nome } }, {
      onSuccess: () => {
        toast({ title: "Categoria criada!" })
        queryClient.invalidateQueries({ queryKey: getGetCategoriasQueryKey() })
        setNome("")
        onClose()
      }
    })
  }

  return (
    <Dialog isOpen={isOpen} onClose={onClose} className="max-w-md">
      <div className="p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
            <Tags className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-display font-bold">Nova Categoria</h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold mb-2">Nome da Categoria</label>
            <Input required value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Massas" />
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" isLoading={isPending} variant="secondary">Criar</Button>
          </div>
        </form>
      </div>
    </Dialog>
  )
}
