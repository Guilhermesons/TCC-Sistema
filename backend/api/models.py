from django.db import models

class Cliente(models.Model):
    nome = models.CharField(max_length=200)
    cpf_cnpj = models.CharField(max_length=20, unique=True)
    telefone = models.CharField(max_length=15)
    email = models.EmailField(blank=True, null=True)

    def __str__(self):
        return self.nome

class Equipamento(models.Model):
    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE, related_name='equipamentos')
    nome = models.CharField(max_length=100) # Ex: Notebook Dell G15
    marca = models.CharField(max_length=50)
    numero_serie = models.CharField(max_length=100, blank=True)

    def __str__(self):
        return f"{self.nome} - {self.cliente.nome}"

class OrdemServico(models.Model):
    STATUS_CHOICES = [
        ('ABERTO', 'Aberto'),
        ('EM_ANDAMENTO', 'Em Andamento'),
        ('CONCLUIDO', 'Concluído'),
        ('CANCELADO', 'Cancelado'),
    ]

    equipamento = models.ForeignKey(Equipamento, on_delete=models.CASCADE)
    descricao_problema = models.TextField()
    relatorio_tecnico = models.TextField(blank=True)
    valor_total = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ABERTO')
    data_criacao = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"OS {self.id} - {self.equipamento.nome}"