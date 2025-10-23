import psycopg2
import random

conn = psycopg2.connect(
    host="localhost",
    database="comanche_db",
    user="root",
    password="postgres",
    port=5432
)
cur = conn.cursor()

total_puyas = 1536
estados = ['florecida', 'no florecida', 'parcialmente florecida', 'muerta']
observaciones_base = [
    "Planta en buen estado",
    "Planta parcialmente seca",
    "Flores abiertas, saludable",
    "Algunas hojas dañadas por viento",
    "Planta en crecimiento",
    "Necesita protección contra pastoreo",
]

for i in range(1, total_puyas + 1):
    edad = random.randint(20, 100)
    estado = random.choice(estados)
    observacion = random.choice(observaciones_base)
    
    cur.execute("""
        INSERT INTO public.puyas_info (conteopuyas_id, edad_estimada, estado_floracion, observaciones)
        VALUES (%s, %s, %s, %s)
    """, (i, edad, estado, observacion))

conn.commit()
cur.close()
conn.close()

print("Se insertaron 1536 registros distintos en puyas_info")
