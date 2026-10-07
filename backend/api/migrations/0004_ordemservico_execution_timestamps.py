from django.db import migrations, models


def backfill_timestamps(apps, schema_editor):
    OrdemServico = apps.get_model('api', 'OrdemServico')
    for order in OrdemServico.objects.all().iterator():
        changed = []
        if order.status == 'in-progress' and order.startedAt is None:
            order.startedAt = order.updatedAt or order.createdAt
            changed.append('startedAt')
        elif order.status == 'completed':
            if order.startedAt is None:
                order.startedAt = order.updatedAt or order.createdAt
                changed.append('startedAt')
            if order.completedAt is None:
                order.completedAt = order.updatedAt or order.createdAt
                changed.append('completedAt')
        if changed:
            order.save(update_fields=changed)


class Migration(migrations.Migration):
    dependencies = [
        ('api', '0003_ordemservico_category_baseprice'),
    ]

    operations = [
        migrations.AddField(
            model_name='ordemservico',
            name='startedAt',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='ordemservico',
            name='completedAt',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.RunPython(backfill_timestamps, migrations.RunPython.noop),
    ]
