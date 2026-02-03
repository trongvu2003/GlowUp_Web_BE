<!-- cài dockerdesktop -->
https://www.docker.com/products/docker-desktop/
<!-- chạy lệnh để cài qdrant (lần đầu duy nhất)-->
docker run -d `
  -p 6333:6333 `
  -p 6334:6334 `
  -v ${PWD}\qdrant_storage:/qdrant/storage `
  --name qdrant `
  qdrant/qdrant

<!--llm dùng cho chatbot (1 lần duy nhất lần sau không cần)  -->
ollama pull nomic-embed-text
ollama pull llama3.2:3b 

npm install


<!--  Tạo Vector Database (chạy 1 lần đầu hoặc khi có sản phẩm mới) -->
npm run index

<!-- lần chạy tiếp theo khi mở code -->
mở app docker và chạy lệnh trong cmd của vsc lệnh: docker start qdrant
npm run dev


**KHÔNG cần:**
-  Pull Ollama models lại
-  Chạy `npm install` lại (trừ khi có dependencies mới)
-  Tạo Qdrant container mới (`docker run...`)
-  Chạy `npm run index` lại (trừ khi database có sản phẩm mới)