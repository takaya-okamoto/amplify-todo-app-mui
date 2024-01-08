"use client";

import * as Yup from "yup";
import { CreateTodoInput, Todo } from "@/API";
import { listTodos } from "@/graphql/queries";
import {
  Alert,
  Button,
  Card,
  Divider,
  FormLabel,
  Input,
  Slide,
  SlideProps,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";
import { generateClient } from "aws-amplify/api";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { createTodo, deleteTodo } from "@/graphql/mutations";
import {
  WithAuthenticatorProps,
  withAuthenticator,
} from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";

import { Amplify } from "aws-amplify";
import amplifyconfig from "../../amplifyconfiguration.json";

Amplify.configure(amplifyconfig);

const client = generateClient();

const Todo = ({ signOut, user }: WithAuthenticatorProps) => {
  // snackbar
  const [open, setOpen] = useState(false);
  const handleClickOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const transitionRight = (props: SlideProps) => {
    return <Slide {...props} direction="right" />;
  };
  // --------------------

  const [todos, setTodos] = useState<Todo[] | CreateTodoInput[]>([]);

  const defaultValues = {
    name: "",
    description: "",
  };
  const validationSchema = Yup.object().shape({
    name: Yup.string().required("Name is required"),
    description: Yup.string(),
  });
  const methods = useForm({
    defaultValues,
    resolver: yupResolver(validationSchema),
  });
  const { handleSubmit, register, resetField } = methods;

  const fetchTodo = async () => {
    try {
      const todoData = await client.graphql({
        query: listTodos,
        variables: { filter: { userId: { eq: user?.userId } } },
      });
      const todos = todoData.data.listTodos.items;
      setTodos(todos);
    } catch (error) {
      console.error(error);
    }
  };

  const addTodo = async (data: Omit<CreateTodoInput, "userId">) => {
    try {
      const todoData = { ...data, userId: user?.userId ?? "" };
      await client.graphql({
        query: createTodo,
        variables: { input: todoData },
      });
      resetField("name");
      resetField("description");
      handleClickOpen();
      await fetchTodo();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteTodo = async (id: string) => {
    try {
      await client.graphql({
        query: deleteTodo,
        variables: { input: { id } },
      });
      handleClickOpen();
      await fetchTodo();
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchTodo();
  }, []);

  return (
    <main>
      <>
        <Stack spacing={3} m={"2rem 1rem"}>
          <Stack
            direction={"row"}
            gap={2}
            sx={{ justifyContent: "space-between" }}
          >
            <Typography variant="h2">amp-app</Typography>
            <Button variant="contained" onClick={signOut}>
              Sign Out
            </Button>
          </Stack>
          <Typography variant="body1">Hello {user?.username} !</Typography>

          <Divider />

          <Stack spacing={3}>
            <Typography variant="h3">Create Todo</Typography>
            <FormProvider {...methods}>
              <form onSubmit={handleSubmit(addTodo)}>
                <Card sx={{ py: "1rem", px: "2rem" }}>
                  <Stack spacing={5}>
                    <Stack>
                      <FormLabel htmlFor="name">Name</FormLabel>
                      <Input
                        {...register("name")}
                        placeholder="Your todo name!"
                      />
                    </Stack>

                    <Stack>
                      <FormLabel htmlFor="description">Description</FormLabel>
                      <Input
                        multiline
                        rows={4}
                        {...register("description")}
                        placeholder="Your todo description!"
                      />
                    </Stack>

                    <Button type="submit" variant="contained">
                      Add
                    </Button>
                  </Stack>
                </Card>
              </form>
            </FormProvider>
          </Stack>

          <Divider />

          <Stack spacing={3}>
            <Typography variant="h3">Todo List</Typography>
            <Stack spacing={3}>
              {todos.map((todo) => (
                <Card key={todo.id} sx={{ py: "1rem", px: "2rem" }}>
                  <Stack>
                    <Typography variant="h6" fontWeight={"bold"}>
                      {todo.name}
                    </Typography>
                    <Typography variant="body1">{todo.description}</Typography>
                  </Stack>

                  <Stack
                    direction={"row"}
                    gap={2}
                    sx={{ justifyContent: "flex-end" }}
                  >
                    <Button
                      variant="contained"
                      onClick={() => {
                        if (typeof todo?.id === "string") {
                          handleDeleteTodo(todo.id);
                        }
                      }}
                    >
                      DONE
                    </Button>
                  </Stack>
                </Card>
              ))}
            </Stack>
          </Stack>
        </Stack>

        <Snackbar
          open={open}
          autoHideDuration={3000}
          onClose={handleClose}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
          TransitionComponent={transitionRight}
        >
          <Alert onClose={handleClose} severity="success">
            Success!
          </Alert>
        </Snackbar>
      </>
    </main>
  );
};

export default withAuthenticator(Todo);
