from decimal import Decimal

from django.utils import timezone
from rest_framework import serializers
from .models import Cliente, Equipamento, OrdemServico


SERVICE_CATEGORY_PRICES = {
    'diagnostic': Decimal('80.00'),
    'software': Decimal('150.00'),
    'preventive': Decimal('180.00'),
    'hardware': Decimal('250.00'),
    'part-installation': Decimal('120.00'),
    'network': Decimal('180.00'),
    'data-recovery': Decimal('300.00'),
}


class ClienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cliente
        fields = '__all__'


class EquipamentoSerializer(serializers.ModelSerializer):
    clientId = serializers.PrimaryKeyRelatedField(
        source='owner', queryset=Cliente.objects.all()
    )
    clientName = serializers.ReadOnlyField(source='owner.name')

    class Meta:
        model = Equipamento
        fields = [
            'id', 'name', 'brand', 'model', 'serialNumber',
            'clientId', 'clientName', 'createdAt'
        ]


class OrdemServicoSerializer(serializers.ModelSerializer):
    clientId = serializers.PrimaryKeyRelatedField(
        source='client', queryset=Cliente.objects.all()
    )
    clientName = serializers.ReadOnlyField(source='client.name')
    equipmentId = serializers.PrimaryKeyRelatedField(
        source='equipment', queryset=Equipamento.objects.all()
    )
    equipmentName = serializers.ReadOnlyField(source='equipment.name')
    basePrice = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    startedAt = serializers.DateTimeField(read_only=True)
    completedAt = serializers.DateTimeField(read_only=True)

    class Meta:
        model = OrdemServico
        fields = [
            'id', 'clientId', 'clientName', 'equipmentId', 'equipmentName',
            'problemDescription', 'category', 'basePrice', 'status', 'price',
            'serviceDone', 'createdAt', 'updatedAt', 'startedAt', 'completedAt'
        ]

    def validate_category(self, value):
        if value == 'legacy':
            if self.instance and self.instance.category == 'legacy':
                return value
            raise serializers.ValidationError('Selecione uma categoria de serviço válida.')
        if value not in SERVICE_CATEGORY_PRICES:
            raise serializers.ValidationError('Categoria de serviço inválida.')
        return value

    def create(self, validated_data):
        category = validated_data.get('category') or 'diagnostic'
        base_price = SERVICE_CATEGORY_PRICES.get(category, Decimal('80.00'))
        status = validated_data.get('status', 'open')
        now = timezone.now()

        validated_data['category'] = category
        validated_data['basePrice'] = base_price
        validated_data['price'] = base_price

        if status in ('in-progress', 'completed'):
            validated_data['startedAt'] = now
        if status == 'completed':
            validated_data['completedAt'] = now

        return super().create(validated_data)

    def update(self, instance, validated_data):
        new_category = validated_data.get('category')
        if new_category and new_category != instance.category and new_category in SERVICE_CATEGORY_PRICES:
            new_base_price = SERVICE_CATEGORY_PRICES[new_category]
            validated_data['basePrice'] = new_base_price
            if instance.status == 'open':
                validated_data['price'] = new_base_price

        old_status = instance.status
        new_status = validated_data.get('status', old_status)
        now = timezone.now()

        if new_status in ('in-progress', 'completed') and old_status == 'open' and not instance.startedAt:
            validated_data['startedAt'] = now

        if new_status == 'completed' and old_status != 'completed' and not instance.completedAt:
            if not instance.startedAt and 'startedAt' not in validated_data:
                validated_data['startedAt'] = now
            validated_data['completedAt'] = now

        return super().update(instance, validated_data)
