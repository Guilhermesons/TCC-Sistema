from rest_framework import serializers
from .models import Cliente, Equipamento, OrdemServico

class ClienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cliente
        fields = '__all__'

class EquipamentoSerializer(serializers.ModelSerializer):
    # Faz o mapeamento de clientId (Front) para owner (Back)
    clientId = serializers.PrimaryKeyRelatedField(
        source='owner', queryset=Cliente.objects.all()
    )
    clientName = serializers.ReadOnlyField(source='owner.name')

    class Meta:
        model = Equipamento
        fields = ['id', 'name', 'brand', 'model', 'serialNumber', 'clientId', 'clientName', 'createdAt']

class OrdemServicoSerializer(serializers.ModelSerializer):
    # Mapeamentos para as chaves do Front
    clientId = serializers.PrimaryKeyRelatedField(
        source='client', queryset=Cliente.objects.all()
    )
    clientName = serializers.ReadOnlyField(source='client.name')
    equipmentId = serializers.PrimaryKeyRelatedField(
        source='equipment', queryset=Equipamento.objects.all()
    )
    equipmentName = serializers.ReadOnlyField(source='equipment.name')

    class Meta:
        model = OrdemServico
        fields = [
            'id', 'clientId', 'clientName', 'equipmentId', 'equipmentName', 
            'problemDescription', 'status', 'price', 'createdAt', 'updatedAt'
        ]