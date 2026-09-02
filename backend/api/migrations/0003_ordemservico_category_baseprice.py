from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0002_ordemservico_servicedone'),
    ]

    operations = [
        migrations.AddField(
            model_name='ordemservico',
            name='category',
            field=models.CharField(
                choices=[
                    ('legacy', 'Sem categoria (OS anterior)'),
                    ('diagnostic', 'Diagnóstico / avaliação'),
                    ('software', 'Software / formatação'),
                    ('preventive', 'Manutenção preventiva'),
                    ('hardware', 'Reparo de hardware'),
                    ('part-installation', 'Instalação / troca de peça'),
                    ('network', 'Rede / configuração'),
                    ('data-recovery', 'Backup / recuperação de dados'),
                ],
                default='legacy',
                max_length=32,
            ),
        ),
        migrations.AddField(
            model_name='ordemservico',
            name='basePrice',
            field=models.DecimalField(decimal_places=2, default=0.0, max_digits=10),
        ),
    ]
