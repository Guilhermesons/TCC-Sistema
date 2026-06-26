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
    # Mudado de description para name para bater com o Front
    name = models.CharField(max_length=255) 
    brand = models.CharField(max_length=100)
    model = models.CharField(max_length=100)
    serialNumber = models.CharField(max_length=100, blank=True, null=True)
    # Mudado para owner para facilitar a relação, mas vamos tratar no Serializer
    owner = models.ForeignKey(Cliente, on_delete=models.CASCADE, related_name='equipamentos')
    createdAt = models.DateTimeField(auto_now_add=True)
    def __str__(self):
        return f"{self.name} - {self.brand} ({self.model})"

class OrdemServico(models.Model):
    # Mudado para bater com o problemDescription do Front
    problemDescription = models.TextField() 
    # Status agora batendo com o Front ('open', 'in-progress', 'completed')
    status = models.CharField(max_length=20, default='open') 
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    client = models.ForeignKey(Cliente, on_delete=models.CASCADE)
    equipment = models.ForeignKey(Equipamento, on_delete=models.CASCADE)
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)