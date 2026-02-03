<!-- cài dockerdesktop -->
<!-- chạy lệnh để cài qdrant -->
docker run -d `
  -p 6333:6333 `
  -p 6334:6334 `
  -v ${PWD}\qdrant_storage:/qdrant/storage `
  --name qdrant `
  qdrant/qdrant

<!--llm dùng cho chatbot  -->
ollama pull nomic-embed-text
ollama pull llama3.2:3b 


<!--  Tạo Vector Database (chạy 1 lần đầu hoặc khi có sản phẩm mới) -->

npm run index
<!-- lần chạy tiếp theo -->
docker start qdrant
