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
    description = models.CharField(max_length=255)
    brand = models.CharField(max_length=100)
    model = models.CharField(max_length=100)
    serialNumber = models.CharField(max_length=100)
    owner = models.ForeignKey(Cliente, on_delete=models.CASCADE, related_name='equipamentos')
    createdAt = models.DateTimeField(auto_now_add=True)

class OrdemServico(models.Model):
    description = models.TextField()
    status = models.CharField(max_length=20, default='PENDING')
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    client = models.ForeignKey(Cliente, on_delete=models.CASCADE)
    equipment = models.ForeignKey(Equipamento, on_delete=models.CASCADE)
    createdAt = models.DateTimeField(auto_now_add=True)