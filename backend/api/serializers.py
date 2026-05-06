from rest_framework import serializers
from .models import Cliente, Equipamento, OrdemServico

class ClienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cliente
        fields = ['id', 'name', 'phone', 'email', 'address', 'createdAt']

class EquipamentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Equipamento
        fields = ['id', 'description', 'brand', 'model', 'serialNumber', 'owner', 'createdAt']

class OrdemServicoSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrdemServico
        fields = ['id', 'description', 'status', 'price', 'client', 'equipment', 'createdAt']