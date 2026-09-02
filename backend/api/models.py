from django.db import models


class Cliente(models.Model):
    name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20)
    email = models.EmailField()
    address = models.TextField()
    createdAt = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Equipamento(models.Model):
    name = models.CharField(max_length=255)
    brand = models.CharField(max_length=100)
    model = models.CharField(max_length=100)
    serialNumber = models.CharField(max_length=100, blank=True, null=True)
    owner = models.ForeignKey(Cliente, on_delete=models.CASCADE, related_name='equipamentos')
    createdAt = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - {self.brand} ({self.model})"


class OrdemServico(models.Model):
    CATEGORY_CHOICES = [
        ('legacy', 'Sem categoria (OS anterior)'),
        ('diagnostic', 'Diagnóstico / avaliação'),
        ('software', 'Software / formatação'),
        ('preventive', 'Manutenção preventiva'),
        ('hardware', 'Reparo de hardware'),
        ('part-installation', 'Instalação / troca de peça'),
        ('network', 'Rede / configuração'),
        ('data-recovery', 'Backup / recuperação de dados'),
    ]

    problemDescription = models.TextField()
    category = models.CharField(max_length=32, choices=CATEGORY_CHOICES, default='legacy')
    basePrice = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    status = models.CharField(max_length=20, default='open')
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    serviceDone = models.TextField(blank=True, default='')
    client = models.ForeignKey(Cliente, on_delete=models.CASCADE)
    equipment = models.ForeignKey(Equipamento, on_delete=models.CASCADE)
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)
