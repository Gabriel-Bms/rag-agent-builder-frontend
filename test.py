import chromadb

client = chromadb.PersistentClient(path=r"C:\Users\gabri\Documents\GbmsRepositorios\rag-agents-backend\data\sessions\80e666a8-c9aa-4df6-ad41-586adc4f195e\chroma_db")

# Listar colecciones
collections = client.list_collections()

print(f"Colecciones encontradas: {len(collections)}")
for col in collections:
    print(f"- Nombre: {col.name}")
    print(f"  UUID: {col.id}")
    print(f"  Metadata: {col.metadata}")
    print(f"  Vectores: {col.count()}")
    print()