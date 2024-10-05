import React, { useState, useEffect, useCallback } from "react";
import styled from "styled-components";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  max-width: 1440px;
  width: 100%;
  margin: 0 auto;
`;

const Title = styled.h1`
  margin-bottom: 20px;
`;

const NewsList = styled.ul`
  list-style: none;
  width: 100%;
  padding: 0;
  display: flex;
  gap: 2%;
  flex-wrap: wrap;
`;

const NewsItem = styled.li`
  display: flex;
  flex-direction: column;
  text-align: center;

  width: 100%;
  align-items: center;
  padding: 10px;
  border-bottom: 1px solid #ddd;
  @media (min-width: 720px) {
    max-width: 32%;
  }
  & > div:first-of-type {
    display: flex;
    justify-content: flex-end;
    gap: 20px;
    width: 100%;
  }
`;

const NewsContent = styled.div`
  flex-grow: 1;
`;

const Button = styled.button`
  padding: 8px 16px;
  border: none;
  border-radius: 5px;
  background-color: #4caf50;
  color: white;
  cursor: pointer;
`;

const Input = styled.input`
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 5px;
  width: 100%;
  margin-bottom: 10px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 400px;
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
`;

const ModalContent = styled.div`
  background-color: white;
  padding: 20px;
  border-radius: 5px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
`;

function App() {
  const [news, setNews] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingNews, setEditingNews] = useState(null);

  useEffect(() => {
    const request = window.indexedDB.open("newsDB", 1);

    request.onerror = (event) => {
      console.error("Ошибка открытия базы данных:", event.target.error);
    };

    request.onsuccess = (event) => {
      const db = event.target.result;
      loadNews(db);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains("news")) {
        db.createObjectStore("news", { keyPath: "id" });
      }
    };
  }, []);

  const loadNews = (db) => {
    const transaction = db.transaction("news", "readonly");
    const objectStore = transaction.objectStore("news");
    const request = objectStore.getAll();

    request.onsuccess = (event) => {
      setNews(event.target.result);
    };
  };

  const saveNews = useCallback(
    (db) => {
      const transaction = db.transaction("news", "readwrite");
      const objectStore = transaction.objectStore("news");

      news.forEach((item) => {
        objectStore.put(item);
      });
    },
    [news]
  );

  const addNews = (e) => {
    e.preventDefault();
    const newNews = {
      id: Date.now(),
      title: e.target.title.value,
      content: e.target.content.value,
    };
    setNews([...news, newNews]);
    e.target.reset();
    const request = window.indexedDB.open("newsDB", 1);
    request.onsuccess = (event) => {
      const db = event.target.result;
      saveNews(db);
    };
  };
  const editNews = (item) => {
    setEditingNews(item);
    setShowModal(true);
  };

  const saveEdit = (e) => {
    e.preventDefault();
    const updatedNews = news.map((n) =>
      n.id === editingNews.id
        ? { ...n, title: e.target.title.value, content: e.target.content.value }
        : n
    );
    setNews(updatedNews);
    setShowModal(false);
    setEditingNews(null);
  };

  const deleteNews = (id) => {
    const updatedNews = news.filter((n) => n.id !== id);
    setNews(updatedNews);

    const request = window.indexedDB.open("newsDB", 1);
    request.onsuccess = (event) => {
      const db = event.target.result;

      const transaction = db.transaction("news", "readwrite");
      const objectStore = transaction.objectStore("news");
      const deleteRequest = objectStore.delete(id);

      deleteRequest.onerror = (error) => {
        console.error(`Ошибка при удалении новости с id ${id}:`, error);
      };
    };
  };
  useEffect(() => {
    const request = window.indexedDB.open("newsDB", 1);
    request.onsuccess = (event) => {
      const db = event.target.result;
      saveNews(db);
    };
  }, [news, saveNews]);
  return (
    <Container>
      <Title>Новости</Title>
      <Form onSubmit={addNews}>
        <Input type="text" name="title" placeholder="Заголовок" />
        <Input type="text" name="content" placeholder="Содержание" />
        <Button type="submit">Добавить</Button>
      </Form>
      <NewsList>
        {news.map((item) => (
          <NewsItem key={item.id}>
            <div>
              <Button onClick={() => editNews(item)}>Редактировать</Button>
              <Button onClick={() => deleteNews(item.id)}>Удалить</Button>{" "}
            </div>
            <NewsContent>
              <h3>{item.title}</h3>
              <p>{item.content}</p>
            </NewsContent>
          </NewsItem>
        ))}
      </NewsList>

      {showModal && (
        <Modal>
          <ModalContent>
            <h2>Редактирование новости</h2>
            <Form onSubmit={saveEdit}>
              <Input
                type="text"
                name="title"
                placeholder="Заголовок"
                defaultValue={editingNews?.title}
              />
              <Input
                type="text"
                name="content"
                placeholder="Содержание"
                defaultValue={editingNews?.content}
              />
              <Button type="submit">Сохранить</Button>
            </Form>
          </ModalContent>
        </Modal>
      )}
    </Container>
  );
}

export default App;
